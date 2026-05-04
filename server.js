const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const config = require('./config/config');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const VERSION = "1.25.3";
const FILE_INFO = `gameassetbundles,GDgOUAbI0rGH7IYYozj+x4YAWiU=,5041,0,AJOItUGjSYdorK+4T8B4erfgUmo=,1487,True,0
main/gameentry,aclCUq5ADSq/d37jcyeAUkr3Oek=,8417,0,d1gnbs/vs21V0wKzRU/I6JodIcI=,2561,True,0`;

app.all(['/app/info/get', '/info/app/info/get'], (req, res) => {
  res.json({ status: 200, message: "success", data: { is_review: false, update_url: "", latest_version: VERSION, force_update: false } });
});
app.get(['/live/ver.php', '/ver.php', '/live/versioninfo', '/versioninfo', '/android/versioninfo'], (req, res) => res.send(VERSION));
app.get(['/sbt/fileinfo', '/fileinfo', '/live/fileinfo', '/android/fileinfo'], (req, res) => res.send(FILE_INFO));

// Endpoints Facebook (Configuração completa para SDK 4.9.0)
app.all('/v2.5/:id', (req, res) => {
  const id = req.params.id;
  const uid = "100067";
  
  if (id === 'me' || id === uid) {
    return res.json({ id: uid, name: "ViniPlayer", first_name: "Vini", last_name: "Player" });
  }
  
  res.json({
    id: id,
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

app.post('/v2.5/:app_id/activities', (req, res) => {
  res.json({ success: true, app_events_config: { custom_events_default_sampling_probability: 1 } });
});

app.get('/v2.5/dialog/oauth', (req, res) => {
  const token = uuidv4();
  const uid = "100067";
  const payload = Buffer.from(JSON.stringify({ user_id: uid, algorithm: "HMAC-SHA256" })).toString('base64');
  const signed_request = "vini_sig." + payload;
  // Fragmento completo para garantir que o SDK capture o token
  const params = `access_token=${token}&expires_in=5184000&signed_request=${signed_request}&user_id=${uid}&base_domain=onrender.com&return_scopes=true&state=vini_state`;
  const finalUrl = `fbconnect://success#${params}`;
  
  res.send(`
    <html>
    <body style="background:#000;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
        <div style="text-align:center;">
            <h2>Vini Server</h2>
            <p>Sincronizando...</p>
            <script>
                window.location.href = "${finalUrl}";
                setTimeout(() => { window.location.href = "${finalUrl}"; }, 1000);
            </script>
        </div>
    </body>
    </html>
  `);
});

const handleLoginSuccess = (req, res) => {
  const token = req.body.facebook_access_token || req.body.access_token || uuidv4();
  const uid = "100067";
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
    last_refresh: now,
    session_key: token,
    token_type: "bearer",
    permissions: ["public_profile", "email"],
    declined_permissions: [],
    status: 200,
    code: 0,
    msg: "success"
  };

  if (req.path.includes('exchange')) {
    console.log(`[Exchange Success] UID: ${uid}`);
    return res.json({ ...response, data: response });
  }

  res.json({ code: 0, msg: "success", data: response, ...response });
};

app.all(['/conn/*', '/sso/*', '/auth/*', '/api/v1/auth/*', '/oauth/token/facebook/exchange'], handleLoginSuccess);

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini V21 (SDK Master) na porta ${PORT}`));
