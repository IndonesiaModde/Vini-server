const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('./config/config');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Logging detalhado para debugar o erro de autenticação
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) console.log("Body:", JSON.stringify(req.body));
  next();
});

// --- ROTA DE DIALOG DO FACEBOOK ---
app.get('/v2.5/dialog/oauth', (req, res) => {
  const access_token = 'vini_fb_token_' + uuidv4().substring(0, 8);
  const user_id = '1000001';
  res.send(`
    <html><body style="background:#000;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;">
    <div style="text-align:center;"><p>Autenticando Vini Server...</p></div>
    <script>
      setTimeout(() => {
        window.location.href = 'fbconnect://success?access_token=${access_token}&user_id=${user_id}&expires_in=5184000';
        if (window.Android && window.Android.onFacebookLogin) window.Android.onFacebookLogin('${access_token}', '${user_id}');
        setTimeout(() => { window.close(); }, 1000);
      }, 1000);
    </script></body></html>
  `);
});

// --- BYPASS DE VERSÃO ---
app.get(['/live/ver.php', '/ver.php', '/live/versioninfo', '/versioninfo'], (req, res) => res.send('1.17.1'));
app.get(['/sbt/fileinfo', '/fileinfo'], (req, res) => res.send(''));

// --- RESPOSTA DE LOGIN MESTRE (O SEGREDO DO SUCESSO) ---
const handleLoginSuccess = (req, res) => {
  const sessionKey = "vini_session_" + uuidv4().replace(/-/g, '').substring(0, 16);
  const token = "vini_token_" + uuidv4().replace(/-/g, '').substring(0, 16);
  const openId = "1000001";

  // Resposta ultra-completa para cobrir todas as versões do MSDK/Garena
  const response = {
    error: 0,
    msg: "success",
    code: 0,
    status: 200,
    session_key: sessionKey,
    access_token: token,
    token: token,
    refresh_token: "vini_refresh_" + uuidv4().substring(0, 8),
    open_id: openId,
    account_id: openId,
    uid: openId,
    username: "ViniPlayer",
    nickname: "ViniPlayer",
    is_new: 0,
    region: "BR",
    login_type: 1,
    expire_time: 5184000,
    session_key_expiry_time: 5184000
  };

  // Algumas versões esperam os dados dentro de um objeto 'data'
  if (req.path.includes('api')) {
      return res.json({ code: 0, msg: "success", data: response });
  }
  
  res.json(response);
};

// Mapear TODAS as rotas de login possíveis
app.all([
  '/conn/*', 
  '/sso/*', 
  '/auth/*', 
  '/api/v1/auth/facebook',
  '/api/v1/auth/login',
  '/app/info/get',
  '/info/app/info/get'
], handleLoginSuccess);

// --- ROTAS ORIGINAIS (INTEGRAÇÃO) ---
const apiPrefix = config.api.prefix;
app.use(`${apiPrefix}/auth`, require('./routes/auth'));
app.use(`${apiPrefix}/user`, require('./routes/user'));
app.use(`${apiPrefix}/game`, require('./routes/game'));
app.use(`${apiPrefix}/shop`, require('./routes/shop'));
app.use(`${apiPrefix}/leaderboard`, require('./routes/leaderboard'));

app.get('/health', (req, res) => res.json({ status: 'ok', version: '4.1.0-fixed-v3' }));

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', path: req.path });
});

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini v4.1.0 Fixed V3 (Ultra-Compat) na porta ${PORT}`));
