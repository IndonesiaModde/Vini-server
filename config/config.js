module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'mrvvinivx-secret-key-2026',
  jwtExpire: '7d',
  
  // URL Base do seu servidor no Render
  baseUrl: 'https://vini-server.onrender.com',
  
  // Database
  database: {
    filename: process.env.DATABASE_PATH || './game.db'
  },
  
  // OAuth Configs (Atualizado com seu App ID real do log)
  facebook: {
    clientID: '2036793259884297',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'facebook-secret',
    callbackURL: 'https://vini-server.onrender.com/v2.5/dialog/oauth'
  },
  
  vk: {
    clientID: process.env.VK_APP_ID || '12345678',
    clientSecret: process.env.VK_APP_SECRET || 'vk-secret',
    callbackURL: 'https://vini-server.onrender.com/auth/vk/callback'
  },
  
  line: {
    clientID: process.env.LINE_CHANNEL_ID || 'line-channel-id',
    clientSecret: process.env.LINE_CHANNEL_SECRET || 'line-secret',
    callbackURL: 'https://vini-server.onrender.com/auth/line/callback'
  },
  
  // Game Config
  game: {
    maxPlayers: 100,
    defaultLevel: 1,
    defaultDiamonds: 100,
    defaultGold: 1000,
    defaultExp: 0
  },
  
  // API
  api: {
    version: 'v1',
    prefix: '/api/v1'
  }
};
