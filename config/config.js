module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'production',
  jwtSecret: process.env.JWT_SECRET || '8K10KA91JSKK9899KSKSK88K8',
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
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'afcf4f835eef14b880e6918ea2ee5cc0',
    callbackURL: 'https://vini-server.onrender.com/v2.5/dialog/oauth'
  },
  
  vk: {
    clientID: process.env.VK_APP_ID || '12345678',
    clientSecret: process.env.VK_APP_SECRET || 'cab4824b525511a8e9fb15b1a9d834da',
    callbackURL: 'https://vini-server.onrender.com/auth/vk/callback'
  },
  
  line: {
    clientID: process.env.LINE_CHANNEL_ID || 'e197685b789ec59c91eef06bb0084fe4',
    clientSecret: process.env.LINE_CHANNEL_SECRET || '06809bc49fc9301f51a02f441681f2c9',
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
