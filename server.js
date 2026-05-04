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
  const uid = "1000001";
  if (id === 'me' || id === uid) {
    return res.json({ id: uid, name: "ViniPlayer", first_name: "Vini", last_name: "Player" });
  }
  res.json({
    id: id,
    name: "Free Fire Vini",
    supports_implicit_sdk_logging: true,
    android_dialog_configs: { oauth: { url: "https://vini-server.onrender.com/v2.5/dialog/oauth" } }
  });
});

app.post('/v2.5/:app_id/activities', (req, res) => res.json({ success: true }));

// --- DIÁLOGO DE LOGIN (FORMATO FRAGMENTO MASTER) ---
app.get('/v2.5/dialog/oauth', (req, res) => {
  const token = uuidv4();
  const uid = "1000001";
  const payload = Buffer.from(JSON.stringify({ user_id: uid, algorithm: "HMAC-SHA256" })).toString('base64');
  const signed_request = "vini_sig." + payload;
  
  // Parâmetros completos no fragmento para o SDK 4.9.0
  const params = `access_token=${token}&expires_in=5184000&signed_request=${signed_request}&user_id=${uid}&return_scopes=true`;
  const finalUrl = `fbconnect://success#${params}`;

  res.send(`
    <html>
    <body style="background:#000;color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;">
        <div style="text-align:center;">
            <h2>Vini Server</h2>
            <p>Sincronizando com o jogo...</p>
            <a href="${finalUrl}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#1877f2;color:white;text-decoration:none;border-radius:5px;">Clique aqui se não redirecionar</a>
        </div>
        <script>
            window.location.href = "${finalUrl}";
            setTimeout(() => { window.location.href = "${finalUrl}"; }, 2000);
        </script>
    </body>
    </html>
  `);
});

const handleLoginSuccess = (req, res) => {
  const token = req.body.facebook_access_token || req.body.access_token || uuidv4();
  const uid = "1000001";
  const now = Date.now();
  
  const response = {
    access_token: token,
    token: token,
    key: token,
    user_id: uid,
    uid: uid,
    id: uid,
    application_id: "2036793259884297",
    expires_in: 5184000,
    expires_at: now + 5184000000,
    session_key: token,
    token_type: "bearer"
  };

  if (req.path.includes('exchange')) {
    console.log(`[Exchange Success] UID: ${uid}`);
    return res.json(response);
  }

  res.json({ code: 0, msg: "success", data: response, ...response });
};

app.all(['/conn/*', '/sso/*', '/auth/*', '/api/v1/auth/*', '/oauth/token/facebook/exchange'], handleLoginSuccess);

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini V21 (Redirect Master) na porta ${PORT}`));
