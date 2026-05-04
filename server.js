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
  if (Object.keys(req.query).length > 0) console.log("Query:", JSON.stringify(req.query));
  if (req.method === 'POST' && Object.keys(req.body).length > 0) console.log("Body:", JSON.stringify(req.body));
  next();
});

const VERSION = "1.26.0";
const FILE_INFO = `gameassetbundles,GDgOUAbI0rGH7IYYozj+x4YAWiU=,5041,0,AJOItUGjSYdorK+4T8B4erfgUmo=,1487,True,0
main/gameentry,aclCUq5ADSq/d37jcyeAUkr3Oek=,8417,0,d1gnbs/vs21V0wKzRU/I6JodIcI=,2561,True,0
localization/lochotfix,yFaLPL2idbOrU8Q8uWQZ2CKIgAU=,4497,0,cwdTsYEsIdH/IBDJHuhlCwwcEHs=,893,True,0
config/resconf,4wESPGAAHI4mUm1OdzBwN7yElZ0=,755422,0,+yfgCC37OG8jAkggbD0uCT1bGXU=,79966,True,0
avatar/assetindexer,dx9nCl5JEKVr91IZSJPUrMpkhO0=,1612502,0,2SXNGYkHwORkHO85KGzbDrbTolo=,241406,True,0
optionalab_1,t+TEi174DHckEJxXOBYBHJ11Mgo=,14531942,0,CbfhgvmWCYZa4a/FG1lmxB+GXpw=,7435643,True,1
optionalab_2,vc30vlPssnNtIg/9kRxRlxn0Blk=,9218238,0,jHwcy6KIhow3W7icBu4EqHAQ0AA=,4351697,True,1`;

// Bypass Versão
app.all(['/app/info/get', '/info/app/info/get'], (req, res) => {
  res.json({ status: 200, message: "success", data: { is_review: false, update_url: "", latest_version: VERSION, force_update: false } });
});
app.get(['/live/ver.php', '/ver.php', '/live/versioninfo', '/versioninfo', '/android/versioninfo'], (req, res) => res.send(VERSION));
app.get(['/sbt/fileinfo', '/fileinfo', '/live/fileinfo', '/android/fileinfo'], (req, res) => res.send(FILE_INFO));

// Resposta de App ID
app.get('/v2.5/:app_id', (req, res) => {
  const appId = req.params.app_id;
  if (appId === 'me') {
    return res.json({
      id: "1000001",
      name: "ViniPlayer"
    });
  }
  res.json({
    id: appId,
    name: "Free Fire Vini",
    supports_implicit_sdk_logging: true,
    gdpv4_nux_enabled: false,
    gdpv4_nux_content: "",
    android_dialog_configs: {
      oauth: { url: "https://vini-server.onrender.com/v2.5/dialog/oauth" }
    },
    android_sdk_error_categories: [
      { name: "login_recoverable", items: [{ code: 102, message: "Login recoverable" }] }
    ]
  });
});

// Atividades
app.post('/v2.5/:app_id/activities', (req, res) => res.json({ success: true }));

const handleLoginSuccess = (req, res) => {
  const token = req.body.facebook_access_token || req.body.access_token || uuidv4();
  const uid = "1000001"; // ID de Usuário (Diferente do App ID)
  const appId = "2036793259884297";
  const now = Date.now(); // Milissegundos (Padrão Java/Android)
  const expires_in = 5184000;
  const expires_at = now + (expires_in * 1000);
  
  const response = {
    access_token: token,
    token: token,
    key: token,
    user_id: uid,
    openid: uid,
    uid: uid,
    application_id: appId,
    expires_in: expires_in,
    expires_at: expires_at,
    last_refresh: now,
    permissions: ["public_profile", "email"],
    declined_permissions: [],
    session_key: token,
    token_type: "bearer"
  };

  if (req.path.includes('exchange')) {
    console.log(`[Exchange Success] Token: ${token}, UID: ${uid}`);
    // Resposta LIMPA apenas com os campos de sucesso que o APK quer
    return res.json(response);
  }

  res.json({ code: 0, msg: "success", data: response, ...response });
};

// Rotas unificadas
app.all(['/conn/*', '/sso/*', '/auth/*', '/api/v1/auth/*', '/v2.5/me', '/oauth/token/facebook/exchange', '/v2.5/dialog/oauth/confirm', '/v2.5/oauth/token/facebook/exchange'], handleLoginSuccess);

// Favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini V21 (Loop Breaker) na porta ${PORT}`));
