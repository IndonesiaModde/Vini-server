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

// Endpoints do Facebook
app.all('/v2.5/:id', (req, res) => {
  const id = req.params.id;
  const uid = "100067"; // Sincronizado com o client_id do APK
  if (id === 'me' || id === uid) {
    return res.json({
      id: uid,
      name: "ViniPlayer",
      first_name: "Vini",
      last_name: "Player",
      email: "vini@player.com",
      picture: { data: { url: "https://vini-server.onrender.com/favicon.ico" } }
    });
  }
  res.json({
    id: id,
    name: "Free Fire Vini",
    supports_implicit_sdk_logging: true,
    android_dialog_configs: { oauth: { url: "https://vini-server.onrender.com/v2.5/dialog/oauth" } }
  });
});

app.post('/v2.5/:app_id/activities', (req, res) => res.json({ success: true }));

// --- DIÁLOGO DE LOGIN ---
app.get('/v2.5/dialog/oauth', (req, res) => {
  const token = uuidv4();
  const uid = "100067";
  const params = `access_token=${token}&expires_in=5184000&user_id=${uid}&return_scopes=true`;
  const finalUrl = `fbconnect://success#${params}`;
  res.send(`<html><script>window.location.href="${finalUrl}";</script></html>`);
});

const handleLoginSuccess = (req, res) => {
  const token = req.body.facebook_access_token || req.body.access_token || uuidv4();
  const uid = "100067";
  const now = Date.now();
  const expires_in = 5184000;
  
  const response = {
    access_token: token,
    token: token,
    key: token,
    user_id: uid,
    uid: uid,
    id: uid,
    openid: uid,
    application_id: "2036793259884297",
    expires_in: expires_in,
    expires_at: now + (expires_in * 1000),
    last_refresh: now,
    session_key: token,
    token_type: "bearer",
    permissions: ["public_profile", "email"],
    declined_permissions: [],
    name: "ViniPlayer",
    email: "vini@player.com",
    status: 200,
    code: 0,
    msg: "success"
  };

  if (req.path.includes('exchange')) {
    console.log(`[Exchange Success] UID: ${uid}`);
    // Resposta Híbrida (Raiz + Data) para compatibilidade universal
    return res.json({
      ...response,
      data: response
    });
  }

  res.json({ code: 0, msg: "success", data: response, ...response });
};

app.all(['/conn/*', '/sso/*', '/auth/*', '/api/v1/auth/*', '/oauth/token/facebook/exchange'], handleLoginSuccess);

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini V21 (Universal Master) na porta ${PORT}`));
