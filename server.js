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
// SUPER SCANNER DE LOGS - FILTRO TOTAL
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

// -----------------------------------------------------------------------
// ENDPOINTS DE VERSÃO E ATUALIZAÇÃO
// -----------------------------------------------------------------------
app.all(['/app/info/get', '/info/app/info/get', '/api/v1/app/info/get'], (req, res) => {
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
// FACEBOOK API v2.5 - EMULAÇÃO COMPLETA
// -----------------------------------------------------------------------
app.get('/v2.5/me', (req, res) => {
  res.json({ 
    id: PLAYER_UID, 
    name: "ViniPlayer", 
    first_name: "Vini", 
    last_name: "Player",
    email: "vini@player.com"
  });
});

app.get('/v2.5/me/permissions', (req, res) => {
  res.json({ 
    data: [
      { permission: "public_profile", status: "granted" }, 
      { permission: "email", status: "granted" },
      { permission: "user_friends", status: "granted" }
    ] 
  });
});

app.all('/v2.5/:id', (req, res) => {
  const id = req.params.id;
  const fields = req.query.fields || '';
  
  if (id === PLAYER_UID || (fields.includes('name') && !fields.includes('android_dialog_configs'))) {
    return res.json({ id: PLAYER_UID, name: "ViniPlayer", first_name: "Vini", last_name: "Player" });
  }

  // Resposta para App ID / Configurações
  res.json({
    id: id,
    name: "Free Fire Vini",
    supports_implicit_sdk_logging: true,
    gdpv4_nux_enabled: false,
    gdpv4_nux_content: "",
    android_dialog_configs: { 
      oauth: { url: `${BASE_URL}/v2.5/dialog/oauth` } 
    },
    android_sdk_error_categories: [
      { name: "login_recoverable", items: [{ code: 102, message: "Login recoverable" }] },
      { name: "other", items: [{ code: 1, message: "Other error" }] }
    ]
  });
});

app.get('/v2.5/dialog/oauth', (req, res) => {
  const token = "vini_" + Math.random().toString(36).substring(2, 15);
  const user_id = PLAYER_UID;
  const expires_in = 5184000;
  
  const payload = Buffer.from(JSON.stringify({ 
    algorithm: "HMAC-SHA256", 
    issued_at: Math.floor(Date.now() / 1000), 
    user_id: user_id 
  })).toString('base64').replace(/=/g, '');
  const signedRequest = `vini_sig.${payload}`;
  
  res.redirect(`/oauth-callback.html?access_token=${token}&user_id=${user_id}&expires_in=${expires_in}&signed_request=${signedRequest}`);
});

// -----------------------------------------------------------------------
// GARENA / AUTH - RESPOSTA ROBUSTA
// -----------------------------------------------------------------------
const sendAuthResponse = (res, token, uid) => {
  const now = Math.floor(Date.now() / 1000);
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
        login_type: 2,
        create_time: now,
        is_new: 0
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
// NETWORK / CONFIG - FILTRO TOTAL DE CONEXÃO
// -----------------------------------------------------------------------
app.all(['/network/config', '/api/v1/network/config'], (req, res) => {
    const domain = "vini-server.onrender.com";
    res.json({
        status: 200, code: 0, msg: "success",
        data: {
            lobby_server: domain,
            lobby_port: 443,
            use_ssl: true,
            gate_server: domain,
            gate_port: 443,
            cdn_url: `${BASE_URL}/live/`,
            update_url: `${BASE_URL}/live/`,
            file_server: domain,
            log_server: domain,
            client_config: {
                show_loading: true,
                skip_tutorial: true,
                enable_log: true
            },
            servers: [
                { name: "Vini Server", ip: domain, port: 443, ssl: true }
            ]
        }
    });
});

// -----------------------------------------------------------------------
// LOBBY / GAMEPLAY / USER
// -----------------------------------------------------------------------
app.all(['/api/v1/user/profile', '/user/profile', '/game/user/info', '/api/v1/game/user/info'], (req, res) => {
    res.json({
        status: 200, code: 0, msg: "success",
        data: {
            uid: PLAYER_UID, 
            nickname: "ViniPlayer", 
            level: 70, 
            exp: 999999, 
            diamonds: 999999, 
            gold: 999999,
            avatar: 1,
            banner: 1,
            region: "BR"
        }
    });
});

app.all(['/game/*', '/api/v1/game/*', '/lobby/*', '/shop/*', '/user/*', '/api/v1/*'], (req, res) => {
  res.json({ 
    status: 200, 
    code: 0, 
    msg: "success", 
    data: { 
        status: "online",
        server_time: Math.floor(Date.now() / 1000)
    } 
  });
});

app.all('/oauth/user/friends/get', (req, res) => res.json({ status: 200, data: { friends: [] } }));
app.all('/pay/*', (req, res) => res.json({ status: 200, message: "success" }));

// -----------------------------------------------------------------------
// LIVE RESOURCES
// -----------------------------------------------------------------------
app.get('/live/*', (req, res) => {
  const resourcePath = req.params[0];
  if (resourcePath && resourcePath.length > 10) {
    return res.redirect(302, `https://freefiremobile-a.akamaihd.net/live/${resourcePath}`);
  }
  res.status(200).end();
});

// -----------------------------------------------------------------------
// ERROR HANDLING - CAPTURA TUDO
// -----------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error("ERRO NO SERVIDOR:", err);
  res.status(200).json({ status: 500, msg: "internal error", error: err.message });
});

const PORT = process.env.PORT || config.port || 3000;
app.listen(PORT, () => console.log(`✅ SERVIDOR VINI V34 ONLINE NA PORTA ${PORT}`));
