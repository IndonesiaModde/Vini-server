const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config/config');

const dbPath = path.resolve(config.database.filename);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err);
  } else {
    console.log('✅ Conectado ao banco de dados SQLite');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      level INTEGER DEFAULT 1,
      exp INTEGER DEFAULT 0,
      diamonds INTEGER DEFAULT 100,
      gold INTEGER DEFAULT 1000,
      facebook_id TEXT,
      vk_id TEXT,
      line_id TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de tokens
  db.run(`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      refresh_token TEXT UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Tabela de inventário
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      equipped BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Tabela de itens da loja
  db.run(`
    CREATE TABLE IF NOT EXISTS shop_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      currency TEXT DEFAULT 'gold',
      type TEXT,
      rarity TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de estatísticas
  db.run(`
    CREATE TABLE IF NOT EXISTS game_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      kills INTEGER DEFAULT 0,
      deaths INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      games_played INTEGER DEFAULT 0,
      headshots INTEGER DEFAULT 0,
      total_damage INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Tabela de eventos
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      reward_type TEXT,
      reward_amount INTEGER,
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de amigos
  db.run(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (friend_id) REFERENCES users(id)
    )
  `);

  // Tabela de clãs
  db.run(`
    CREATE TABLE IF NOT EXISTS clans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      leader_id INTEGER NOT NULL,
      description TEXT,
      level INTEGER DEFAULT 1,
      exp INTEGER DEFAULT 0,
      members_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (leader_id) REFERENCES users(id)
    )
  `);

  // Tabela de membros do clã
  db.run(`
    CREATE TABLE IF NOT EXISTS clan_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clan_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clan_id) REFERENCES clans(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('✅ Tabelas do banco de dados criadas/verificadas');
  seedDatabase();
}

function seedDatabase() {
  // Verificar se já existem itens na loja
  db.get('SELECT COUNT(*) as count FROM shop_items', (err, row) => {
    if (row && row.count === 0) {
      const items = [
        { name: 'AK47', description: 'Rifle automático poderoso', price: 500, currency: 'gold', type: 'weapon', rarity: 'common' },
        { name: 'M249', description: 'Metralhadora de alto dano', price: 800, currency: 'gold', type: 'weapon', rarity: 'rare' },
        { name: 'AWM', description: 'Sniper de longo alcance', price: 1500, currency: 'diamonds', type: 'weapon', rarity: 'epic' },
        { name: 'Skin Vermelha', description: 'Skin exclusiva vermelha', price: 200, currency: 'diamonds', type: 'skin', rarity: 'rare' },
        { name: 'Pet Lobo', description: 'Pet de companhia lobo', price: 300, currency: 'diamonds', type: 'pet', rarity: 'epic' },
        { name: 'Mochila Tática', description: 'Aumenta capacidade', price: 100, currency: 'gold', type: 'accessory', rarity: 'common' }
      ];

      items.forEach(item => {
        db.run(
          'INSERT INTO shop_items (name, description, price, currency, type, rarity) VALUES (?, ?, ?, ?, ?, ?)',
          [item.name, item.description, item.price, item.currency, item.type, item.rarity]
        );
      });

      console.log('✅ Itens da loja adicionados');
    }
  });

  // Verificar se já existem eventos
  db.get('SELECT COUNT(*) as count FROM events', (err, row) => {
    if (row && row.count === 0) {
      const now = new Date();
      const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      db.run(
        'INSERT INTO events (name, description, start_date, end_date, reward_type, reward_amount, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Evento de Boas-vindas', 'Ganhe diamantes extras', now.toISOString(), endDate.toISOString(), 'diamonds', 50, 1]
      );

      console.log('✅ Eventos iniciais adicionados');
    }
  });
}

module.exports = db;
