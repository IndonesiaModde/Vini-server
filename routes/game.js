const express = require('express');
const db = require('../database/database');
const { verifyToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Iniciar jogo
router.post('/start', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const { game_mode, map } = req.body;

  if (!game_mode || !map) {
    return res.status(400).json({ error: 'game_mode e map são obrigatórios' });
  }

  const gameId = uuidv4();
  const serverIp = process.env.GAME_SERVER_IP || 'game.barbosasmobile.com';
  const port = Math.floor(Math.random() * (9999 - 5000 + 1)) + 5000;

  res.json({
    success: true,
    game_id: gameId,
    user_id: userId,
    game_mode: game_mode,
    map: map,
    server_ip: serverIp,
    port: port,
    max_players: 100,
    current_players: Math.floor(Math.random() * 100),
    started_at: new Date().toISOString()
  });
});

// Finalizar jogo
router.post('/end', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const { game_id, kills, deaths, rank, exp_earned, diamonds_earned } = req.body;

  if (!game_id) {
    return res.status(400).json({ error: 'game_id é obrigatório' });
  }

  // Atualizar estatísticas
  db.get('SELECT * FROM game_stats WHERE user_id = ?', [userId], (err, stats) => {
    if (stats) {
      db.run(
        `UPDATE game_stats 
         SET kills = kills + ?, deaths = deaths + ?, wins = wins + ?, games_played = games_played + 1, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`,
        [kills || 0, deaths || 0, rank === 1 ? 1 : 0, userId]
      );
    } else {
      db.run(
        'INSERT INTO game_stats (user_id, kills, deaths, wins, games_played) VALUES (?, ?, ?, ?, ?)',
        [userId, kills || 0, deaths || 0, rank === 1 ? 1 : 0, 1]
      );
    }
  });

  // Atualizar recursos
  const expToAdd = exp_earned || 10;
  const diamondsToAdd = diamonds_earned || 0;

  db.run(
    'UPDATE users SET exp = exp + ?, diamonds = diamonds + ? WHERE id = ?',
    [expToAdd, diamondsToAdd, userId]
  );

  res.json({
    success: true,
    game_id: game_id,
    user_id: userId,
    exp_earned: expToAdd,
    diamonds_earned: diamondsToAdd,
    rank: rank,
    ended_at: new Date().toISOString()
  });
});

// Obter histórico de jogos
router.get('/history', verifyToken, (req, res) => {
  const userId = req.user.userId;

  db.get('SELECT * FROM game_stats WHERE user_id = ?', [userId], (err, stats) => {
    if (err || !stats) {
      return res.json({
        user_id: userId,
        stats: {
          kills: 0,
          deaths: 0,
          wins: 0,
          games_played: 0,
          headshots: 0,
          total_damage: 0
        }
      });
    }

    res.json({
      user_id: userId,
      stats: stats
    });
  });
});

// Obter eventos ativos
router.get('/events', (req, res) => {
  const now = new Date().toISOString();

  db.all(
    'SELECT * FROM events WHERE active = 1 AND start_date <= ? AND end_date >= ?',
    [now, now],
    (err, events) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar eventos' });
      }

      res.json({
        events: events || []
      });
    }
  );
});

// Participar de evento
router.post('/events/:eventId/join', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const eventId = req.params.eventId;

  db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, event) => {
    if (err || !event) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    res.json({
      success: true,
      user_id: userId,
      event_id: eventId,
      event_name: event.name,
      reward_type: event.reward_type,
      reward_amount: event.reward_amount,
      joined_at: new Date().toISOString()
    });
  });
});

module.exports = router;
