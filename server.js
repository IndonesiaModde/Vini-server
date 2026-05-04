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

// --- PÁGINA DE LOGIN (V8 - CAPTURA POR TÍTULO E FRAGMENTO) ---
app.get('/v2.5/dialog/oauth', (req, res) => {
  const token = 'EAAG' + uuidv4().replace(/-/g, '').substring(0, 32);
  const uid = '1000001';
  
  // Redireciona para uma URL que termina em #access_token=... (padrão oficial FB)
  const successUrl = `/connect/login_success.html#access_token=${token}&user_id=${uid}&expires_in=5184000`;
  res.redirect(successUrl);
});

// Página de Sucesso que o WebView monitora
app.get('/connect/login_success.html', (req, res) => {
    res.send(`
        <html>
        <head><title>Success access_token=EAAG_VINI_TOKEN</title></head>
        <body style="background:#000;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;">
            <div style="text-align:center;">
                <h2>Vini Server</h2>
                <p>Login Concluído!</p>
            </div>
            <script>
                // Muda o título para o token real - Muitos WebViews capturam assim
                const hash = window.location.hash.substring(1);
                document.title = "Success " + hash;
                
                // Tenta fechar e redirecionar também por segurança
                setTimeout(() => {
                    window.location.href = "fbconnect://success?" + hash;
                    if (window.Android && window.Android.onFacebookLogin) {
                        const params = new URLSearchParams(hash);
                        window.Android.onFacebookLogin(params.get('access_token'), params.get('user_id'));
                    }
                }, 1000);
            </script>
        </body>
        </html>
    `);
});

// --- ROTA DE PERFIL DO FACEBOOK (/v2.5/me) ---
app.get('/v2.5/me', (req, res) => {
  res.json({
    id: "1000001",
    name: "ViniPlayer",
    first_name: "Vini",
    last_name: "Player",
    email: "vini@server.com",
    picture: { data: { url: "https://vini-server-1.onrender.com/favicon.ico" } }
  });
});

// Validação de App ID
app.get('/v2.5/:app_id', (req, res) => {
  if (req.params.app_id === 'me') return; // Ignora se for a rota /me
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

app.get('/health', (req, res) => res.json({ status: 'ok', version: '4.1.0-fixed-v8' }));

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini V8 (Title Capture) na porta ${PORT}`));
