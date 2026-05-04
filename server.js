const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('./config/config');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------------------------------------------------
// SUPER SCANNER DE LOGS
// -----------------------------------------------------------------------
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n>>>>>>>> [${timestamp}] ${req.method} ${req.originalUrl} <<<<<<<<`);
  if (Object.keys(req.query).length > 0) console.log("QUERY:", JSON.stringify(req.query));
  if (req.body && Object.keys(req.body).length > 0) console.log("BODY:", JSON.stringify(req.body));
  
  const oldJson = res.json;
  res.json = function(data) {
    console.log("RESPOSTA JSON:", JSON.stringify(data));
    return oldJson.apply(res, arguments);
  };
  next();
});

const VERSION = "1.26.0";
const PLAYER_UID = "100067";
const BASE_URL = config.baseUrl || 'https://vini-server.onrender.com';

// Endpoints de Versão
app.all(['/app/info/get', '/info/app/info/get'], (req, res) => {
  res.json({
    status: 200,
    message: "success",
    data: {
      is_review: false,
      update_url: "",
      latest_version: VERSION,
      force_update: false,
      content_url: `${BASE_URL}/live/`
    }
  });
});

app.get(['/live/ver.php', '/ver.php', '/live/versioninfo', '/versioninfo', '/android/versioninfo'], (req, res) => {
  const myUrl = `${BASE_URL}/live/`;
  if (req.path.includes('ver.php')) {
    return res.send(`${VERSION},${myUrl},${myUrl},${myUrl}`);
  }
  res.send(VERSION);
});

// -----------------------------------------------------------------------
// FACEBOOK API v2.5
// -----------------------------------------------------------------------

app.get('/v2.5/me', (req, res) => {
  res.json({ id: PLAYER_UID, name: "ViniPlayer", first_name: "Vini", last_name: "Player" });
});

app.get('/v2.5/me/permissions', (req, res) => {
  res.json({ data: [{ permission: "public_profile", status: "granted" }, { permission: "email", status: "granted" }] });
});

app.all('/v2.5/:id', (req, res) => {
  const id = req.params.id;
  const fields = req.query.fields || '';
  if (id === PLAYER_UID || (fields.includes('name') && !fields.includes('android_dialog_configs'))) {
    return res.json({ id: PLAYER_UID, name: "ViniPlayer", first_name: "Vini", last_name: "Player" });
  }
  res.json({
    id: id,
    name: "Free Fire Vini",
    supports_implicit_sdk_logging: true,
    gdpv4_nux_enabled: false,
    android_dialog_configs: { oauth: { url: `${BASE_URL}/v2.5/dialog/oauth` } },
    android_sdk_error_categories: [{ name: "login_recoverable", items: [{ code: 102, message: "Login recoverable" }] }]
  });
});

app.get('/v2.5/dialog/oauth', (req, res) => {
  const token = "vini_" + Math.random().toString(36).substring(2, 15);
  const user_id = PLAYER_UID;
  const expires_in = 5184000;
  
  // Em vez de redirecionar direto para o app (que causa erro de conexão em alguns webviews)
  // Redirecionamos para uma página de callback que faz o trabalho via JS
  res.redirect(`/oauth-callback.html?access_token=${token}&user_id=${user_id}&expires_in=${expires_in}`);
});

// -----------------------------------------------------------------------
// GARENA / AUTH - RESPOSTA MINIMALISTA
// -----------------------------------------------------------------------

const sendAuthResponse = (res, token, uid) => {
  const now = Math.floor(Date.now() / 1000);
  
  // Resposta limpa, sem campos duplicados na raiz
  res.json({
    status: 200,
    code: 0,
    msg: "success",
    data: {
        access_token: token,
        refreshToken: token,
        openId: `vini_${uid}`,
        user_id: uid,
        uid: uid,
        nickname: "ViniPlayer",
        expiryTimestamp: now + 5184000,
        tokenProvider: 0,
        login_type: 2
    }
  });
};

app.all([
  '/oauth/guest/register', '/oauth/token/inspect', '/oauth/user/info/get',
  '/oauth/token/facebook/exchange', '/api/v1/auth/*', '/auth/*', '/conn/*', '/sso/*'
], (req, res) => {
  const token = req.body.access_token || req.query.access_token || req.body.facebook_access_token || uuidv4();
  sendAuthResponse(res, token, PLAYER_UID);
});

// -----------------------------------------------------------------------
// LOBBY / GAMEPLAY
// -----------------------------------------------------------------------

app.all(['/network/config', '/api/v1/network/config'], (req, res) => {
    res.json({
        status: 200, code: 0, msg: "success",
        data: {
            lobby_server: "vini-server.onrender.com",
            lobby_port: 443,
            use_ssl: true,
            // Adicionando campos extras que o cliente pode estar esperando
            gate_server: "vini-server.onrender.com",
            gate_port: 443
        }
    });
});

app.all(['/api/v1/user/profile', '/user/profile', '/game/user/info'], (req, res) => {
    res.json({
        status: 200, code: 0, msg: "success",
        data: {
            uid: PLAYER_UID, nickname: "ViniPlayer", level: 70, exp: 999999, diamonds: 999999, gold: 999999
        }
    });
});

app.all(['/game/*', '/api/v1/game/*', '/lobby/*', '/shop/*', '/user/*'], (req, res) => {
  res.json({ status: 200, code: 0, msg: "success", data: { status: "online" } });
});

app.all('/oauth/user/friends/get', (req, res) => res.json({ status: 200, data: { friends: [] } }));
app.all('/pay/*', (req, res) => res.json({ status: 200, message: "success" }));

app.get('/live/*', (req, res) => {
  const resourcePath = req.params[0];
  if (resourcePath.length > 20) {
    return res.redirect(302, `https://freefiremobile-a.akamaihd.net/live/${resourcePath}`);
  }
  res.status(200).end();
});

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini V34 (Minimal Response) na porta ${PORT}`));
