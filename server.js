const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('./config/config');
const db = require('./database/database');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// --- ROTA DE DIALOG DO FACEBOOK (CORREÇÃO DA TELA BRANCA) ---

app.get('/v2.5/dialog/oauth', (req, res) => {
  const access_token = 'vini_fb_token_' + uuidv4().substring(0, 8);
  const user_id = '1000001';
  
  // Este HTML simula o sucesso do login e redireciona o WebView do jogo
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Facebook Login Success</title>
        <style>
            body { background: #000; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
            .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    </head>
    <body>
        <div style="text-align: center;">
            <div class="loader" style="margin: 0 auto 20px;"></div>
            <p>Autenticando no servidor Vini...</p>
        </div>
        <script>
          const token = '${access_token}';
          const userId = '${user_id}';
          
          // Tentar os 3 métodos de retorno do MSDK
          setTimeout(() => {
            // 1. Redirecionamento de Protocolo (Mais comum)
            window.location.href = 'fbconnect://success?access_token=' + token + '&user_id=' + userId + '&expires_in=5184000';
            
            // 2. Interface Java (WebView)
            if (window.Android && window.Android.onFacebookLogin) {
              window.Android.onFacebookLogin(token, userId);
            }
            
            // 3. Fallback para fechar
            setTimeout(() => { window.close(); }, 1000);
          }, 1500);
        </script>
    </body>
    </html>
  `;
  res.send(html);
});

// Outras rotas do FB SDK
app.all('/v2.5/:app_id/activities', (req, res) => {
  res.json({ success: true });
});

// --- ROTAS DE BYPASS DE VERSÃO ---

app.get(['/live/ver.php', '/ver.php'], (req, res) => {
  res.send('1.17.1');
});

app.get(['/live/versioninfo', '/versioninfo'], (req, res) => {
  res.send('1.17.1');
});

app.get(['/sbt/fileinfo', '/fileinfo'], (req, res) => {
  res.send('');
});

// --- ROTAS DE LOGIN E CONFIGURAÇÃO (MSDK) ---

app.all(['/app/info/get', '/info/app/info/get'], (req, res) => {
  res.json({
    status: 200,
    message: "success",
    data: { is_review: false, update_url: "", latest_version: "1.17.1" }
  });
});

app.all(['/conn/*', '/sso/*', '/auth/facebook'], (req, res) => {
  res.json({
    error: 0,
    msg: "success",
    session_key: "vini_session_" + uuidv4().substring(0, 8),
    access_token: "vini_token_" + uuidv4().substring(0, 8),
    account_id: "1000001",
    username: "ViniPlayer",
    is_new: false
  });
});

// --- INTEGRAÇÃO COM ROTAS ORIGINAIS ---

const apiPrefix = config.api.prefix;
app.use(`${apiPrefix}/auth`, require('./routes/auth'));
app.use(`${apiPrefix}/user`, require('./routes/user'));
app.use(`${apiPrefix}/game`, require('./routes/game'));
app.use(`${apiPrefix}/shop`, require('./routes/shop'));
app.use(`${apiPrefix}/leaderboard`, require('./routes/leaderboard'));

app.get('/health', (req, res) => res.json({ status: 'ok', version: '4.1.0-fixed-v2' }));

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', path: req.path, method: req.method });
});

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => {
  console.log(`✅ Servidor Vini v4.1.0 Fixed V2 rodando na porta ${PORT}`);
});
