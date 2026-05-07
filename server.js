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

// --- BYPASS BARBOSA (versionscommon.barbosasmobile.com) ---
app.get(['/live/ver.php', '/ver.php'], (req, res) => res.send(VERSION));
app.get(['/live/versioninfo', '/versioninfo', '/android/versioninfo'], (req, res) => res.send(`${VERSION}\n10`));
app.get(['/live/fileinfo', '/fileinfo', '/android/fileinfo', '/sbt/fileinfo'], (req, res) => res.send(FILE_INFO));
app.get('/live/maintenance.php', (req, res) => res.json({ status: "online", maintenance: false, message: "Vini Server Online" }));

// --- BYPASS VERSÃO GARENA ---
app.all(['/app/info/get', '/info/app/info/get'], (req, res) => {
  res.json({ status: 200, message: "success", data: { is_review: false, update_url: "", latest_version: VERSION, force_update: false } });
});

// --- CONFIGURAÇÃO DE SDK DO FACEBOOK ---
app.get('/v2.5/:app_id', (req, res) => {
  const appId = req.params.app_id;
  if (appId === 'me') return res.json({ id: "1000001", name: "ViniPlayer" });
  res.json({
    id: appId, name: "Free Fire Vini", supports_implicit_sdk_logging: true, gdpv4_nux_enabled: false,
    android_dialog_configs: { oauth: { url: "https://vini-server.onrender.com/v2.5/dialog/oauth" } },
    android_sdk_error_categories: [{ name: "login_recoverable", items: [{ code: 102, message: "Login recoverable" }] }]
  });
});

// --- DIÁLOGO DE LOGIN (V23 - HYBRID SYNC) ---
app.get('/v2.5/dialog/oauth', (req, res) => {
  const s = uuidv4().replace(/-/g, '');
  const token = "EAAG_VINI_" + s.substring(0, 24);
  const uid = "1000001";
  const payload = Buffer.from(JSON.stringify({ user_id: uid, algorithm: "HMAC-SHA256", issued_at: Math.floor(Date.now()/1000) })).toString('base64');
  const signed_request = "vini_sig." + payload;
  const e2e = req.query.e2e || "{}";
  const params = `access_token=${token}&expires_in=5184000&signed_request=${signed_request}&user_id=${uid}&e2e=${encodeURIComponent(e2e)}&return_scopes=true`;
  const finalUrl = `fbconnect://success?${params}#${params}`;

  res.send(`
    <html><head><title>Success access_token=${token}</title></head>
    <body style="background:#000;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;">
        <div style="text-align:center;">
            <h2 style="color:#1877f2;">Vini Server</h2>
            <p>Sincronizando Barbosa & Facebook...</p>
            <div style="border:3px solid #1877f2;border-radius:50%;width:40px;height:40px;border-top-color:transparent;animation:spin 1s linear infinite;margin:20px auto;"></div>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        <script>
            window.location.href = "${finalUrl}";
            if (window.Android && window.Android.onFacebookLogin) window.Android.onFacebookLogin("${token}", "${uid}");
            setTimeout(() => { window.location.href = "${finalUrl}"; }, 1500);
        </script>
    </body></html>
  `);
});

const handleLoginSuccess = (req, res) => {
  const s = uuidv4().replace(/-/g, '');
  const uid = "1000001";
  const response = {
    error: 0, msg: "success", code: 0, status: 200,
    session_key: "s_" + s.substring(0, 16), access_token: "EAAG_" + s.substring(0, 24),
    token: "EAAG_" + s.substring(0, 24), refresh_token: "r_" + s.substring(0, 8),
    openid: uid, open_id: uid, account_id: uid, uid: uid,
    username: "ViniPlayer", nickname: "ViniPlayer", is_new: 0, region: "BR", login_type: 1, expire_time: 5184000,
    glive_session_key: "s_" + s.substring(0, 16), glive_uid: uid, session_key_expiry_time: 5184000
  };
  res.json({ code: 0, msg: "success", data: response, ...response });
};

app.all(['/conn/*', '/sso/*', '/auth/*', '/api/v1/auth/*', '/v2.5/me'], handleLoginSuccess);

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini V23 (Barbosa + Login) na porta ${PORT}`));
