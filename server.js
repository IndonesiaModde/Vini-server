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

// --- BYPASS DE VERSÃO ---
app.all(['/app/info/get', '/info/app/info/get'], (req, res) => {
  res.json({ status: 200, message: "success", data: { is_review: false, update_url: "", latest_version: VERSION } });
});
app.get(['/live/ver.php', '/ver.php', '/live/versioninfo', '/versioninfo', '/android/versioninfo'], (req, res) => res.send(VERSION));
app.get(['/sbt/fileinfo', '/fileinfo', '/live/fileinfo', '/android/fileinfo'], (req, res) => res.send(FILE_INFO));

// --- DIÁLOGO DE LOGIN (Sincronizado com ServerProtocol.java) ---
app.get('/v2.5/dialog/oauth', (req, res) => {
  const s = uuidv4().replace(/-/g, '');
  const token = "EAAG_VINI_" + s.substring(0, 24);
  const uid = "1000001";
  const signed_request = "vini_signed_req_" + s.substring(0, 32);
  
  // Parâmetros conforme DIALOG_RESPONSE_TYPE_TOKEN_AND_SIGNED_REQUEST
  const params = `access_token=${token}&expires_in=5184000&signed_request=${signed_request}&user_id=${uid}`;
  
  console.log("Login Success - Sending Redirect to fbconnect://success");
  
  // Redirecionamento 302 direto conforme DIALOG_REDIRECT_URI
  res.redirect(302, `fbconnect://success?${params}#${params}`);
});

// --- RESPOSTA DE LOGIN MESTRE (MSDK Barbosa) ---
const handleLoginSuccess = (req, res) => {
  const s = uuidv4().replace(/-/g, '');
  const uid = "1000001";
  const response = {
    error: 0, msg: "success", code: 0, status: 200,
    session_key: "s_" + s.substring(0, 16),
    access_token: "EAAG_" + s.substring(0, 24),
    token: "EAAG_" + s.substring(0, 24),
    refresh_token: "r_" + s.substring(0, 8),
    openid: uid, open_id: uid, account_id: uid, uid: uid,
    username: "ViniPlayer", nickname: "ViniPlayer",
    is_new: 0, region: "BR", login_type: 1, expire_time: 5184000,
    glive_session_key: "s_" + s.substring(0, 16), glive_uid: uid,
    session_key_expiry_time: 5184000
  };
  res.json({ code: 0, msg: "success", data: response, ...response });
};

app.all(['/conn/*', '/sso/*', '/auth/*', '/api/v1/auth/*', '/v2.5/me'], handleLoginSuccess);
app.get('/v2.5/:app_id', (req, res) => res.json({ id: req.params.app_id, name: "Free Fire Vini", permissions: ["public_profile"] }));

app.get('/health', (req, res) => res.json({ status: 'ok', version: VERSION }));

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini V16 (ServerProtocol Sync) na porta ${PORT}`));
