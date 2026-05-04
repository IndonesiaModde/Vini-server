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

// SISTEMA DE SUPER LOG
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n--- [${timestamp}] ${req.method} ${req.path} ---`);
  if (Object.keys(req.query).length > 0) console.log("QUERY:", JSON.stringify(req.query));
  if (req.body && Object.keys(req.body).length > 0) console.log("BODY:", JSON.stringify(req.body));
  
  const oldJson = res.json;
  res.json = function(data) {
    console.log("RESPOSTA:", JSON.stringify(data));
    return oldJson.apply(res, arguments);
  };
  next();
});

const VERSION = "1.26.0";
const FILE_INFO = `gameassetbundles,mzZtylZ1fawV5N8D8XikRyF+5mY=,12060,0
main/gameentry,DZlCrLRuzwyuNzUZrh+p0QxJCcI=,2018,0
localization/loc,gWXz0dDNM8MJyFcAFhzbqWWqvrY=,632921,0
ingame/avatarmanager,Tjb+QEzOiGwy+DBpxlLrVBZRphA=,1915,0
config/resconf,ysnx0NubzKPaLVGszrP45y9WQH0=,34896,0
avatar/assetindexer,IbV74Hqrb07rdlrKYQx6JZIhZ5M=,74343,0
avatar/uma_dcs,BSJQtQt6qEeFdLv8gsrVtPDQubo=,14523,0`;

const PLAYER_UID = "100067";

// Endpoints de Versão e Recursos
app.all(['/app/info/get', '/info/app/info/get'], (req, res) => {
  res.json({ status: 200, message: "success", data: { is_review: false, update_url: "", latest_version: VERSION, force_update: false } });
});
app.get(['/live/ver.php', '/ver.php', '/live/versioninfo', '/versioninfo', '/android/versioninfo'], (req, res) => {
  if (req.path.includes('ver.php')) {
    const myUrl = "https://vini-server.onrender.com/live/";
    return res.send(`${VERSION},${myUrl},${myUrl},${myUrl}`);
  }
  res.send(VERSION);
});
app.get(['/sbt/fileinfo', '/fileinfo', '/live/fileinfo', '/android/fileinfo'], (req, res) => res.send(FILE_INFO));

// -----------------------------------------------------------------------
// FACEBOOK API v2.5
// -----------------------------------------------------------------------

// Perfil e Permissões
app.get('/v2.5/me', (req, res) => {
  res.json({ id: PLAYER_UID, name: "ViniPlayer", first_name: "Vini", last_name: "Player" });
});

app.get('/v2.5/me/permissions', (req, res) => {
  res.json({ data: [{ permission: "public_profile", status: "granted" }, { permission: "email", status: "granted" }] });
});

// App Config e Perfil Genérico
app.all('/v2.5/:id', (req, res) => {
  const id = req.params.id;
  const fields = req.query.fields || '';
  
  // Se for pedido de perfil
  if (id === PLAYER_UID || (fields.includes('name') && !fields.includes('android_dialog_configs'))) {
    return res.json({ id: PLAYER_UID, name: "ViniPlayer", first_name: "Vini", last_name: "Player" });
  }

  // Se for pedido de config do App
  res.json({
    id: id,
    name: "Free Fire Vini",
    supports_implicit_sdk_logging: true,
    gdpv4_nux_enabled: false,
    android_dialog_configs: { oauth: { url: "https://vini-server.onrender.com/v2.5/dialog/oauth" } },
    android_sdk_error_categories: [{ name: "login_recoverable", items: [{ code: 102, message: "Login recoverable" }] }]
  });
});

// Facebook OAuth Redirect (CORREÇÃO: Query String + Signed Request)
app.get('/v2.5/dialog/oauth', (req, res) => {
  const token = uuidv4();
  // signed_request fake para satisfazer o SDK
  const signedRequest = "vini_signed_request_data";
  const params = `access_token=${token}&expires_in=5184000&user_id=${PLAYER_UID}&base_domain=onrender.com&return_scopes=true&signed_request=${signedRequest}`;
  
  const finalUrl = `fbconnect://success?${params}`;
  console.log(`[OAuth] Redirecionando para: ${finalUrl}`);
  res.redirect(302, finalUrl);
});

app.post('/v2.5/:app_id/activities', (req, res) => {
  res.json({ success: true, app_events_config: { custom_events_default_sampling_probability: 1 } });
});

// -----------------------------------------------------------------------
// GARENA / BEETALK ENDPOINTS
// -----------------------------------------------------------------------

const createAuthResponse = (token, uid) => {
  const now = Math.floor(Date.now() / 1000);
  return {
    authToken: token,
    token: token,
    access_token: token,
    refreshToken: token,
    openId: uid,
    user_id: uid,
    uid: uid,
    expiryTimestamp: now + 5184000,
    expires_in: 5184000,
    lastInspectTime: now,
    tokenProvider: 0,
    status: 200,
    code: 0,
    msg: "success"
  };
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
  const response = createAuthResponse(token, PLAYER_UID);
  
  if (req.path.includes('exchange') || req.path.includes('info/get')) {
    return res.json({ ...response, data: response });
  }
  
  res.json(response);
});

app.all('/oauth/user/friends/get', (req, res) => res.json({ status: 200, data: { friends: [] } }));
app.all('/pay/*', (req, res) => res.json({ status: 200, message: "success" }));
app.all('/game/user/request/send', (req, res) => res.json({ status: 200, message: "success" }));

// Rota para recursos /live/*
app.get('/live/*', (req, res) => {
  const resourcePath = req.params[0];
  if (resourcePath.length > 20) {
    return res.redirect(302, `https://freefiremobile-a.akamaihd.net/live/${resourcePath}`);
  }
  res.status(200).end();
});

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini V25 (Final Fix) na porta ${PORT}`));
