module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'mrvvinivx-secret-key-2026',
  jwtExpire: '7d',
  
  // Database
  database: {
    filename: process.env.DATABASE_PATH || './game.db'
  },
  
  // OAuth Configs
  facebook: {
    clientID: process.env.FACEBOOK_APP_ID || '1234567890',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'facebook-secret',
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/auth/facebook/callback'
  },
  
  vk: {
    clientID: process.env.VK_APP_ID || '12345678',
    clientSecret: process.env.VK_APP_SECRET || 'vk-secret',
    callbackURL: process.env.VK_CALLBACK_URL || 'http://localhost:3000/auth/vk/callback'
  },
  
  line: {
    clientID: process.env.LINE_CHANNEL_ID || 'line-channel-id',
    clientSecret: process.env.LINE_CHANNEL_SECRET || 'line-secret',
    callbackURL: process.env.LINE_CALLBACK_URL || 'http://localhost:3000/auth/line/callback'
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
