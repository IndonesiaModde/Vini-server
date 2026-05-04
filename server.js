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
  console.log("HEADERS:", JSON.stringify(req.headers));
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
const BASE_URL = config.baseUrl;

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
  const token = Math.random().toString(36).substring(2, 15);
  const payload = Buffer.from(JSON.stringify({ algorithm: "HMAC-SHA256", issued_at: Math.floor(Date.now() / 1000), user_id: PLAYER_UID })).toString('base64').replace(/=/g, '');
  const signedRequest = `vini_signature.${payload}`;
  const params = `access_token=${token}&expires_in=5184000&user_id=${PLAYER_UID}&base_domain=onrender.com&return_scopes=true&signed_request=${signedRequest}`;
  res.redirect(302, `fbconnect://success?${params}`);
});

// -----------------------------------------------------------------------
// GARENA / AUTH
// -----------------------------------------------------------------------

const sendAuthResponse = (res, token, uid) => {
  const now = Math.floor(Date.now() / 1000);
  const authData = {
    authToken: token,
    token: token,
    access_token: token,
    refreshToken: token,
    openId: uid,
    user_id: uid,
    uid: uid,
    account_id: uid,
    expiryTimestamp: now + 5184000,
    expires_in: 5184000,
    lastInspectTime: now,
    tokenProvider: 0,
    login_type: 2,
    is_guest: false,
    status: 200,
    code: 0,
    msg: "success"
  };
  res.json({ ...authData, data: authData });
};

app.all([
  '/oauth/guest/register',
  '/oauth/token/inspect',
  '/oauth/user/info/get',
  '/oauth/token/facebook/exchange',
  '/api/v1/auth/*',
  '/auth/*',
  '/conn/*',
  '/sso/*'
], (req, res) => {
  const token = req.body.access_token || req.query.access_token || req.body.facebook_access_token || uuidv4();
  sendAuthResponse(res, token, PLAYER_UID);
});

// Outros endpoints
app.all(['/game/*', '/api/v1/game/*', '/lobby/*', '/shop/*', '/user/*'], (req, res) => {
  res.json({ status: 200, code: 0, msg: "success", data: {} });
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
app.listen(PORT, () => console.log(`✅ Servidor Vini V29 (Config Sync) na porta ${PORT}`));
