const express = require('express');
const cors = require('cors');
const path = require('path');
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

// --- NOVO DIÁLOGO DE LOGIN (CALLBACK DIRETO) ---
app.get('/v2.5/dialog/oauth', (req, res) => {
  const token = 'vini_fb_token_' + uuidv4().replace(/-/g, '');
  const uid = '1000001';
  
  // HTML que tenta injetar o token de todas as formas possíveis
  res.send(`
    <html><body style="background:#000;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
    <div style="text-align:center;">
        <h2>Vini Server</h2>
        <p>Autenticando conta...</p>
        <div id="status">Aguarde...</div>
    </div>
    <script>
      const token = "${token}";
      const uid = "${uid}";
      const renderUrl = "https://vini-server-1.onrender.com";

      function finish() {
        // 1. Tentar Interface Java do MSDK
        if (window.Android && window.Android.onFacebookLogin) {
            window.Android.onFacebookLogin(token, uid);
        }
        
        // 2. Tentar Redirecionamento de Protocolo
        window.location.href = "fbconnect://success?access_token=" + token + "&user_id=" + uid;
        
        // 3. Tentar Redirecionamento para o Servidor (Callback)
        setTimeout(() => {
            window.location.href = renderUrl + "/auth/login_callback?token=" + token + "&uid=" + uid;
        }, 1000);
      }
      
      document.getElementById('status').innerText = "Enviando credenciais...";
      setTimeout(finish, 1500);
    </script></body></html>
  `);
});

// Rota de Callback para processar o login após o diálogo
app.get('/auth/login_callback', (req, res) => {
    console.log("Login callback received for UID:", req.query.uid);
    handleLoginSuccess(req, res);
});

// Validação de App ID
app.get('/v2.5/:app_id', (req, res) => {
  res.json({ id: req.params.app_id, name: "Free Fire Vini", permissions: ["public_profile"] });
});

// --- BYPASS DE VERSÃO ---
app.get(['/live/ver.php', '/ver.php', '/live/versioninfo', '/versioninfo'], (req, res) => res.send('1.17.1'));
app.get(['/sbt/fileinfo', '/fileinfo'], (req, res) => res.send(''));

// --- RESPOSTA DE LOGIN MESTRE (ULTRA COMPAT) ---
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

  if (req.path.includes('api') || req.query.token) {
      return res.json({ code: 0, msg: "success", data: response });
  }
  res.json(response);
};

app.all([
  '/conn/*', '/sso/*', '/auth/*', '/api/v1/auth/*', 
  '/app/info/get', '/info/app/info/get'
], handleLoginSuccess);

// --- ROTAS ORIGINAIS ---
const apiPrefix = config.api.prefix;
app.use(`${apiPrefix}/auth`, require('./routes/auth'));
app.use(`${apiPrefix}/user`, require('./routes/user'));
app.use(`${apiPrefix}/game`, require('./routes/game'));

app.get('/health', (req, res) => res.json({ status: 'ok', version: '4.1.0-fixed-v5' }));
app.use((req, res) => res.status(404).json({ error: '404', path: req.path }));

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini V5 (Callback Master) na porta ${PORT}`));
