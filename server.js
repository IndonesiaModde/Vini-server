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

// --- DADOS REAIS EXTRAÍDOS DO APK ---
const VERSION_APK = "1.25.3";
const VERSION_INFO = "1.26.0";
const FILE_INFO_CONTENT = `gameassetbundles,GDgOUAbI0rGH7IYYozj+x4YAWiU=,5041,0,AJOItUGjSYdorK+4T8B4erfgUmo=,1487,True,0
main/gameentry,aclCUq5ADSq/d37jcyeAUkr3Oek=,8417,0,d1gnbs/vs21V0wKzRU/I6JodIcI=,2561,True,0
localization/lochotfix,yFaLPL2idbOrU8Q8uWQZ2CKIgAU=,4497,0,cwdTsYEsIdH/IBDJHuhlCwwcEHs=,893,True,0
config/resconf,4wESPGAAHI4mUm1OdzBwN7yElZ0=,755422,0,+yfgCC37OG8jAkggbD0uCT1bGXU=,79966,True,0
avatar/assetindexer,dx9nCl5JEKVr91IZSJPUrMpkhO0=,1612502,0,2SXNGYkHwORkHO85KGzbDrbTolo=,241406,True,0
optionalab_1,t+TEi174DHckEJxXOBYBHJ11Mgo=,14531942,0,CbfhgvmWCYZa4a/FG1lmxB+GXpw=,7435643,True,1
optionalab_2,vc30vlPssnNtIg/9kRxRlxn0Blk=,9218238,0,jHwcy6KIhow3W7icBu4EqHAQ0AA=,4351697,True,1`;

// --- ROTAS DE SISTEMA (Sincronização Total) ---
app.get(['/live/ver.php', '/ver.php', '/live/versioninfo', '/versioninfo', '/android/versioninfo'], (req, res) => {
    // Retorna 1.26.0 conforme o arquivo versioninfo do APK
    res.send(VERSION_INFO);
});

app.get(['/sbt/fileinfo', '/fileinfo', '/live/fileinfo', '/android/fileinfo'], (req, res) => {
    res.send(FILE_INFO_CONTENT);
});

// --- DIÁLOGO DE LOGIN (V11) ---
app.get('/v2.5/dialog/oauth', (req, res) => {
  const token = 'EAAG' + uuidv4().replace(/-/g, '').substring(0, 32);
  const uid = '1000001';
  res.send(`
    <html><head><title>Success access_token=${token}</title></head>
    <body style="background:#000;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;">
        <div style="text-align:center;"><h2>Vini Server</h2><p>Autenticando...</p></div>
        <script>
            const token = "${token}";
            const uid = "${uid}";
            window.location.hash = "access_token=" + token + "&user_id=" + uid;
            if (window.Android && window.Android.onFacebookLogin) window.Android.onFacebookLogin(token, uid);
            setTimeout(() => {
                window.location.href = "fbconnect://success?access_token=" + token + "&user_id=" + uid;
                setTimeout(() => { window.close(); }, 500);
            }, 1000);
        </script>
    </body></html>
  `);
});

// --- RESPOSTA DE LOGIN MESTRE (Multi-Versão) ---
const handleLoginSuccess = (req, res) => {
  const s = uuidv4().replace(/-/g, '');
  const response = {
    error: 0, msg: "success", code: 0, status: 200,
    session_key: "s_" + s.substring(0, 16),
    access_token: "t_" + s.substring(0, 16),
    token: "t_" + s.substring(0, 16),
    refresh_token: "r_" + s.substring(0, 8),
    open_id: "1000001", account_id: "1000001", uid: "1000001",
    username: "ViniPlayer", nickname: "ViniPlayer",
    is_new: 0, region: "BR", login_type: 1, expire_time: 5184000,
    version: VERSION_APK // Usa 1.25.3 para o login
  };
  res.json({ code: 0, msg: "success", data: response, ...response });
};

app.all([
  '/conn/*', '/sso/*', '/auth/*', '/api/v1/auth/*', 
  '/app/info/get', '/info/app/info/get'
], handleLoginSuccess);

app.get('/v2.5/me', (req, res) => res.json({ id: "1000001", name: "ViniPlayer" }));
app.get('/v2.5/:app_id', (req, res) => res.json({ id: req.params.app_id, name: "Free Fire Vini" }));

app.get('/health', (req, res) => res.json({ status: 'ok', version: VERSION_APK }));

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini V11 (Full Sync) na porta ${PORT}`));
