const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const config = require('./config/config');
const db = require('./database/database');

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const gameRoutes = require('./routes/game');
const shopRoutes = require('./routes/shop');
const leaderboardRoutes = require('./routes/leaderboard');

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'MrViniVx Game Server is running!',
    version: '4.1.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Rota de versão (compatível com APK)
app.get('/version/check', (req, res) => {
  res.json({
    version: '4.1.0',
    updateAvailable: false,
    downloadUrl: '',
    status: 'ok'
  });
});

// Rota de conexão (compatível com APK)
app.get('/connect/info', (req, res) => {
  res.json({
    server_name: 'MrViniVx Server',
    server_version: '4.1.0',
    status: 'online',
    max_players: config.game.maxPlayers,
    current_players: Math.floor(Math.random() * config.game.maxPlayers),
    timestamp: new Date().toISOString()
  });
});

// Rotas de API
const apiPrefix = config.api.prefix;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/user`, userRoutes);
app.use(`${apiPrefix}/game`, gameRoutes);
app.use(`${apiPrefix}/shop`, shopRoutes);
app.use(`${apiPrefix}/leaderboard`, leaderboardRoutes);

// Página de login (compatível com APK)
app.get('/panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota de admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ✅ ROTA FINAL: OAuth Facebook retorna HTML que fecha automaticamente
app.get('/v2.5/dialog/oauth', (req, res) => {
  const access_token = 'mock_facebook_token_' + Date.now();
  const user_id = Math.floor(Math.random() * 1000000);
  
  // Retornar HTML que simula sucesso e fecha
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Success</title>
    </head>
    <body>
        <script>
            // Dados do login
            const data = {
                access_token: '${access_token}',
                user_id: ${user_id},
                expires_in: 5184000
            };
            
            // Tentar comunicar com app nativo
            if (window.android) {
                if (window.android.onLoginSuccess) {
                    window.android.onLoginSuccess(JSON.stringify(data));
                }
            }
            
            // Fechar a aba
            window.close();
        </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

app.post('/v2.5/dialog/oauth', (req, res) => {
  const access_token = 'mock_facebook_token_' + Date.now();
  const user_id = Math.floor(Math.random() * 1000000);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Success</title>
    </head>
    <body>
        <script>
            const data = {
                access_token: '${access_token}',
                user_id: ${user_id},
                expires_in: 5184000
            };
            
            if (window.android) {
                if (window.android.onLoginSuccess) {
                    window.android.onLoginSuccess(JSON.stringify(data));
                }
            }
            
            window.close();
        </script>
    </body>
    </html>
  `;
  
  res.send(html);
});


// ✅ ROTA NOVA: Processa o callback do Facebook automaticamente
app.get('/fbconnect/success', (req, res) => {
  try {
    const access_token = req.query.access_token;
    const user_id = req.query.user_id;
    
    if (!access_token || !user_id) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        success: false
      });
    }
    
    // Criar username baseado no user_id do Facebook
    const username = 'fb_user_' + user_id;
    const email = user_id + '@facebook.local';
    
    // Gerar token JWT para o jogo
    const gameToken = jwt.sign(
      { 
        id: user_id, 
        username: username,
        provider: 'facebook'
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    
    // Retornar dados para o jogo
    res.json({
      success: true,
      token: gameToken,
      user: {
        id: user_id,
        username: username,
        email: email,
        level: 1,
        exp: 0,
        diamonds: 1000,
        gold: 5000
      },
      expires_in: 604800,
      redirect: '/dashboard'
    });
  } catch (error) {
    console.error('Erro ao processar callback:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      success: false
    });
  }
});

// ✅ ROTA NOVA: Login com token Facebook
app.post(`${apiPrefix}/auth/facebook`, (req, res) => {
  try {
    const { access_token, user_id } = req.body;
    
    if (!access_token || !user_id) {
      return res.status(400).json({
        error: 'access_token e user_id sao obrigatorios',
        success: false
      });
    }
    
    // Criar username baseado no user_id do Facebook
    const username = 'fb_user_' + user_id;
    const email = user_id + '@facebook.local';
    
    // Gerar token JWT para o jogo
    const gameToken = jwt.sign(
      { 
        id: user_id, 
        username: username,
        provider: 'facebook'
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    
    // Retornar dados para o jogo
    res.json({
      success: true,
      token: gameToken,
      user: {
        id: user_id,
        username: username,
        email: email,
        level: 1,
        exp: 0,
        diamonds: 1000,
        gold: 5000
      },
      expires_in: 604800
    });
  } catch (error) {
    console.error('Erro ao fazer login com Facebook:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      success: false
    });
  }
});

// Rota de autenticação VK
app.get('/vk/oauth', (req, res) => {
  res.json({
    access_token: 'mock_vk_token_' + Date.now(),
    user_id: Math.floor(Math.random() * 1000000)
  });
});

// Rota de autenticação Line
app.get('/line/oauth', (req, res) => {
  res.json({
    access_token: 'mock_line_token_' + Date.now(),
    user_id: Math.floor(Math.random() * 1000000)
  });
});

// Rota de autenticação Garena
app.get('/garena/oauth', (req, res) => {
  res.json({
    access_token: 'mock_garena_token_' + Date.now(),
    user_id: Math.floor(Math.random() * 1000000)
  });
});

// Rota de info do app Facebook
app.get('/v2.5/:app_id', (req, res) => {
  res.json({
    id: req.params.app_id,
    name: 'MrViniVx Game',
    supports_implicit_sdk_logging: true,
    gdpv4_nux_content: '',
    gdpv4_nux_enabled: false,
    android_dialog_configs: [],
    android_sdk_error_categories: []
  });
});

// Rota de info da aplicacao
app.get('/app/info/get', (req, res) => {
  res.json({
    app_id: req.query.app_id || '100067',
    client_type: req.query.client_type || '4352',
    client_version: req.query.client_version || '2018120316',
    status: 'ok',
    version: '4.1.0',
    server_time: Date.now()
  });
});

// Rota de atividades do Facebook
app.post('/v2.5/:app_id/activities', (req, res) => {
  res.json({
    success: true,
    app_id: req.params.app_id,
    timestamp: Date.now()
  });
});

app.get('/v2.5/:app_id/activities', (req, res) => {
  res.json({
    success: true,
    app_id: req.params.app_id,
    activities: []
  });
});

// Rota de dashboard
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Iniciar servidor
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   MRVVINIVX GAME SERVER v${config.game.maxPlayers === 100 ? '4.1.0' : '4.1.0'}              ║
╚════════════════════════════════════════╝

✅ Servidor rodando na porta ${PORT}
📍 URL: http://localhost:${PORT}
🌐 Painel: http://localhost:${PORT}/panel
🔐 Admin: http://localhost:${PORT}/admin
📡 API: http://localhost:${PORT}${apiPrefix}

Endpoints disponíveis:
  POST   ${apiPrefix}/auth/register
  POST   ${apiPrefix}/auth/login
  POST   ${apiPrefix}/auth/guest
  POST   ${apiPrefix}/auth/facebook ⭐ NOVO
  POST   ${apiPrefix}/auth/vk
  POST   ${apiPrefix}/auth/logout
  GET    ${apiPrefix}/user/profile
  GET    ${apiPrefix}/user/inventory
  GET    ${apiPrefix}/user/friends
  POST   ${apiPrefix}/game/start
  POST   ${apiPrefix}/game/end
  GET    ${apiPrefix}/game/events
  GET    ${apiPrefix}/shop/items
  POST   ${apiPrefix}/shop/buy
  POST   ${apiPrefix}/shop/sell
  GET    ${apiPrefix}/leaderboard/kills
  GET    ${apiPrefix}/leaderboard/wins
  GET    ${apiPrefix}/leaderboard/level

Ambiente: ${config.nodeEnv}
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
