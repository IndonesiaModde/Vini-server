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

// --- PÁGINA DE LOGIN COM BOTÃO (V7 - BYPASS DE BLOQUEIO WEBVIEW) ---
app.get('/v2.5/dialog/oauth', (req, res) => {
  const token = 'EAAG' + uuidv4().replace(/-/g, '').substring(0, 32);
  const uid = '1000001';
  const appId = "2036793259884297";
  
  res.send(`
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { background: #121212; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; margin: 0; }
            .btn { background: #1877f2; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
            .btn:active { transform: scale(0.98); background: #166fe5; }
        </style>
    </head>
    <body>
        <div style="text-align:center;">
            <h2 style="margin-bottom: 20px;">Vini Server Login</h2>
            <button class="btn" onclick="doLogin()">ENTRAR NO JOGO</button>
            <p id="status" style="margin-top: 15px; color: #aaa; font-size: 14px;">Clique no botão para autenticar</p>
        </div>
        <script>
          function doLogin() {
            const token = "${token}";
            const uid = "${uid}";
            const appId = "${appId}";
            
            document.getElementById('status').innerText = "Autenticando...";
            
            // Tentativa 1: Esquema FB oficial
            window.location.href = "fb" + appId + "://authorize?access_token=" + token + "&user_id=" + uid;
            
            // Tentativa 2: Esquema FB connect (fallback)
            setTimeout(() => {
                window.location.href = "fbconnect://success?access_token=" + token + "&user_id=" + uid;
            }, 500);

            // Tentativa 3: Interface Java
            if (window.Android && window.Android.onFacebookLogin) {
                window.Android.onFacebookLogin(token, uid);
            }
          }
          
          // Auto-login após 3 segundos se não clicar
          setTimeout(doLogin, 3000);
        </script>
    </body>
    </html>
  `);
});

// Validação de App ID
app.get('/v2.5/:app_id', (req, res) => {
  res.json({ id: req.params.app_id, name: "Free Fire Vini", permissions: ["public_profile"] });
});

// --- BYPASS DE VERSÃO ---
app.get(['/live/ver.php', '/ver.php', '/live/versioninfo', '/versioninfo'], (req, res) => res.send('1.17.1'));
app.get(['/sbt/fileinfo', '/fileinfo'], (req, res) => res.send(''));

// --- RESPOSTA DE LOGIN MESTRE ---
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
    is_new: 0, region: "BR", login_type: 1, expire_time: 5184000
  };
  res.json({ code: 0, msg: "success", data: response, ...response });
};

app.all(['/conn/*', '/sso/*', '/auth/*', '/api/v1/auth/*', '/app/info/get', '/info/app/info/get'], handleLoginSuccess);

app.get('/health', (req, res) => res.json({ status: 'ok', version: '4.1.0-fixed-v7' }));

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini V7 (Manual Login) na porta ${PORT}`));
