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
const DOMAIN = "vini-server.onrender.com";

// -----------------------------------------------------------------------
// ENDPOINTS DE VERSÃO E ATUALIZAÇÃO (SUPORTE AMPLO)
// -----------------------------------------------------------------------
const versionResponse = (req, res) => {
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
};

app.all(['/app/info/get', '/info/app/info/get', '/api/v1/app/info/get', '/v1/app/info/get'], versionResponse);

app.get(['/live/ver.php', '/ver.php', '/live/versioninfo', '/versioninfo', '/android/versioninfo', '/api/v1/versioninfo'], (req, res) => {
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
    email: "vini@player.com",
    link: `https://www.facebook.com/app_scoped_user_id/${PLAYER_UID}/`
  });
});

app.get('/v2.5/me/permissions', (req, res) => {
  res.json({ 
    data: [
      { permission: "public_profile", status: "granted" }, 
      { permission: "email", status: "granted" },
      { permission: "user_friends", status: "granted" },
      { permission: "publish_actions", status: "granted" }
    ] 
  });
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
    gdpv4_nux_content: "",
    android_dialog_configs: { 
      oauth: { url: `${BASE_URL}/v2.5/dialog/oauth` } 
    },
    android_sdk_error_categories: [
      { name: "login_recoverable", items: [{ code: 102, message: "Login recoverable" }] },
      { name: "other", items: [{ code: 1, message: "Other error" }] },
      { name: "transient", items: [{ code: 2, message: "Transient error" }] }
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

// Suporte para activities do Facebook (comum em logs)
app.post('/v2.5/:id/activities', (req, res) => {
  res.json({ success: true });
});

// -----------------------------------------------------------------------
// GARENA / AUTH - RESPOSTA ROBUSTA E COMPLETA
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
        is_new: 0,
        gender: 1,
        birth: "2000-01-01",
        email: "vini@player.com"
    }
  });
};

app.all([
  '/oauth/guest/register', '/oauth/token/inspect', '/oauth/user/info/get',
  '/oauth/token/facebook/exchange', '/api/v1/auth/*', '/auth/*', '/conn/*', '/sso/*',
  '/api/v1/oauth/*', '/v1/oauth/*'
], (req, res) => {
  const token = req.body.access_token || req.query.access_token || req.body.facebook_access_token || uuidv4();
  sendAuthResponse(res, token, PLAYER_UID);
});

// -----------------------------------------------------------------------
// NETWORK / CONFIG - FILTRO TOTAL DE CONEXÃO
// -----------------------------------------------------------------------
app.all(['/network/config', '/api/v1/network/config', '/v1/network/config'], (req, res) => {
    res.json({
        status: 200, code: 0, msg: "success",
        data: {
            lobby_server: DOMAIN,
            lobby_port: 443,
            use_ssl: true,
            gate_server: DOMAIN,
            gate_port: 443,
            cdn_url: `${BASE_URL}/live/`,
            update_url: `${BASE_URL}/live/`,
            file_server: DOMAIN,
            log_server: DOMAIN,
            api_server: DOMAIN,
            pay_server: DOMAIN,
            client_config: {
                show_loading: true,
                skip_tutorial: true,
                enable_log: true,
                heartbeat_interval: 30,
                reconnect_interval: 5,
                max_reconnect_times: 3
            },
            servers: [
                { name: "Vini Server", ip: DOMAIN, port: 443, ssl: true, status: 1, load: 0 }
            ],
            regions: [
                { id: "BR", name: "Brasil", domain: DOMAIN }
            ]
        }
    });
});

// -----------------------------------------------------------------------
// LOBBY / GAMEPLAY / USER - SUPORTE AMPLO
// -----------------------------------------------------------------------
const userProfileResponse = (req, res) => {
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
            region: "BR",
            create_time: 1600000000,
            last_login_time: Math.floor(Date.now() / 1000),
            stats: {
                wins: 1000,
                kills: 5000,
                games: 2000
            }
        }
    });
};

app.all([
    '/api/v1/user/profile', '/user/profile', '/game/user/info', '/api/v1/game/user/info',
    '/v1/user/profile', '/v1/game/user/info'
], userProfileResponse);

app.all([
    '/game/*', '/api/v1/game/*', '/lobby/*', '/shop/*', '/user/*', '/api/v1/*', '/v1/*',
    '/api/v1/lobby/*', '/api/v1/shop/*', '/api/v1/user/*'
], (req, res) => {
  res.json({ 
    status: 200, 
    code: 0, 
    msg: "success", 
    data: { 
        status: "online",
        server_time: Math.floor(Date.now() / 1000),
        message: "Operation successful"
    } 
  });
});

app.all(['/oauth/user/friends/get', '/api/v1/oauth/user/friends/get'], (req, res) => res.json({ status: 200, data: { friends: [] } }));
app.all(['/pay/*', '/api/v1/pay/*'], (req, res) => res.json({ status: 200, message: "success" }));

// -----------------------------------------------------------------------
// LIVE RESOURCES - REDIRECIONAMENTO INTELIGENTE
// -----------------------------------------------------------------------
app.get(['/live/*', '/android/live/*'], (req, res) => {
  const resourcePath = req.params[0];
  if (resourcePath && resourcePath.length > 5) {
    return res.redirect(302, `https://freefiremobile-a.akamaihd.net/live/${resourcePath}`);
  }
  res.status(200).end();
});

// -----------------------------------------------------------------------
// TRATAMENTO DE ERROS E 404 - NÃO DEIXA NADA PASSAR
// -----------------------------------------------------------------------
app.use((req, res, next) => {
    // Se chegou aqui, o endpoint não foi mapeado, mas vamos responder sucesso para o app não travar
    if (req.originalUrl.includes('api') || req.originalUrl.includes('oauth') || req.originalUrl.includes('game')) {
        return res.json({ status: 200, code: 0, msg: "success", data: {} });
    }
    next();
});

app.use((err, req, res, next) => {
  console.error("ERRO NO SERVIDOR:", err);
  res.status(200).json({ status: 200, code: 0, msg: "success", error: err.message });
});

const PORT = process.env.PORT || config.port || 3000;
app.listen(PORT, () => console.log(`✅ SERVIDOR VINI V34 TOTALMENTE OPERACIONAL NA PORTA ${PORT}`));
