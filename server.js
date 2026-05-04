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

// Logging detalhado
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// --- ROTAS DO SDK DO FACEBOOK (CORREÇÃO DOS LOGS) ---

// Suporte para validação de App ID (Ex: /v2.5/2036793259884297)
app.get('/v2.5/:app_id', (req, res) => {
  const appId = req.params.app_id;
  console.log(`Validando Facebook App ID: ${appId}`);
  
  // Resposta que o SDK do Facebook espera para validar o App
  res.json({
    id: appId,
    name: "Free Fire Vini",
    permissions: ["public_profile", "email", "user_friends"],
    category: "Games"
  });
});

// Rota de Diálogo de Login
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

app.all('/v2.5/:app_id/activities', (req, res) => res.json({ success: true }));
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- BYPASS DE VERSÃO ---
app.get(['/live/ver.php', '/ver.php', '/live/versioninfo', '/versioninfo'], (req, res) => res.send('1.17.1'));
app.get(['/sbt/fileinfo', '/fileinfo'], (req, res) => res.send(''));

// --- RESPOSTA DE LOGIN MESTRE ---
const handleLoginSuccess = (req, res) => {
  const sessionKey = "vini_session_" + uuidv4().replace(/-/g, '').substring(0, 16);
  const token = "vini_token_" + uuidv4().replace(/-/g, '').substring(0, 16);
  const openId = "1000001";

  const response = {
    error: 0, msg: "success", code: 0, status: 200,
    session_key: sessionKey, access_token: token, token: token,
    refresh_token: "vini_refresh_" + uuidv4().substring(0, 8),
    open_id: openId, account_id: openId, uid: openId,
    username: "ViniPlayer", nickname: "ViniPlayer",
    is_new: 0, region: "BR", login_type: 1,
    expire_time: 5184000, session_key_expiry_time: 5184000
  };

  if (req.path.includes('api')) return res.json({ code: 0, msg: "success", data: response });
  res.json(response);
};

app.all([
  '/conn/*', '/sso/*', '/auth/*', '/api/v1/auth/facebook',
  '/api/v1/auth/login', '/app/info/get', '/info/app/info/get'
], handleLoginSuccess);

// --- INTEGRAÇÃO COM ROTAS ORIGINAIS ---
const apiPrefix = config.api.prefix;
app.use(`${apiPrefix}/auth`, require('./routes/auth'));
app.use(`${apiPrefix}/user`, require('./routes/user'));
app.use(`${apiPrefix}/game`, require('./routes/game'));
app.use(`${apiPrefix}/shop`, require('./routes/shop'));
app.use(`${apiPrefix}/leaderboard`, require('./routes/leaderboard'));

app.get('/health', (req, res) => res.json({ status: 'ok', version: '4.1.0-fixed-v4' }));

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', path: req.path });
});

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini v4.1.0 Fixed V4 (FB Validated) na porta ${PORT}`));
