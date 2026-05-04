const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const config = require('./config/config');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// --- REDIRECIONAMENTO DIRETO (PULA A TELA DE LOGIN) ---
app.get('/v2.5/dialog/oauth', (req, res) => {
  const token = 'vini_fb_token_' + uuidv4().replace(/-/g, '');
  const uid = '1000001';
  
  console.log("Forçando redirecionamento de login direto...");
  
  // Em vez de HTML, enviamos um redirecionamento HTTP 302 direto para o esquema do jogo
  // Isso funciona mesmo se o JS estiver desativado na WebView
  const redirectUrl = `fbconnect://success?access_token=${token}&user_id=${uid}&expires_in=5184000`;
  res.redirect(302, redirectUrl);
});

// Validação de App ID (Também responde com sucesso)
app.get('/v2.5/:app_id', (req, res) => {
  res.json({ 
    id: req.params.app_id, 
    name: "Free Fire Vini", 
    permissions: ["public_profile"],
    status: "active"
  });
});

// --- BYPASS DE VERSÃO ---
app.get(['/live/ver.php', '/ver.php', '/live/versioninfo', '/versioninfo'], (req, res) => res.send('1.17.1'));
app.get(['/sbt/fileinfo', '/fileinfo'], (req, res) => res.send(''));

// --- RESPOSTA DE LOGIN MESTRE ---
const handleLoginSuccess = (req, res) => {
  const s = uuidv4().replace(/-/g, '');
  const response = {
    error: 0, msg: "success", code: 0, status: 200,
    session_key: "s_" + s.substring(0, 16),
    access_token: "t_" + s.substring(0, 16),
    token: "t_" + s.substring(0, 16),
    refresh_token: "r_" + s.substring(0, 8),
    open_id: "1000001", account_id: "1000001", uid: "1000001",
    username: "ViniPlayer", nickname: "ViniPlayer",
    is_new: 0, region: "BR", login_type: 1, expire_time: 5184000
  };

  // Suporte para o formato 'data' que o MSDK gosta
  res.json({ code: 0, msg: "success", data: response, ...response });
};

app.all([
  '/conn/*', '/sso/*', '/auth/*', '/api/v1/auth/*', 
  '/app/info/get', '/info/app/info/get'
], handleLoginSuccess);

// --- INTEGRAÇÃO COM ROTAS ORIGINAIS ---
const apiPrefix = config.api.prefix;
app.use(`${apiPrefix}/auth`, require('./routes/auth'));
app.use(`${apiPrefix}/user`, require('./routes/user'));
app.use(`${apiPrefix}/game`, require('./routes/game'));

app.get('/health', (req, res) => res.json({ status: 'ok', version: '4.1.0-fixed-v6' }));
app.use((req, res) => res.status(404).json({ error: '404', path: req.path }));

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini V6 (Direct Redirect) na porta ${PORT}`));
