const express = require('express');
const db = require('../database/database');

const router = express.Router();

// Leaderboard global por kills
router.get('/kills', (req, res) => {
  const limit = req.query.limit || 100;

  db.all(
    `SELECT u.id, u.username, u.level, u.avatar_url, gs.kills, gs.deaths, gs.wins, gs.games_played
     FROM users u
     LEFT JOIN game_stats gs ON u.id = gs.user_id
     ORDER BY gs.kills DESC
     LIMIT ?`,
    [limit],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar leaderboard' });
      }

      const leaderboard = (users || []).map((user, index) => ({
        rank: index + 1,
        user_id: user.id,
        username: user.username,
        level: user.level,
        avatar_url: user.avatar_url,
        kills: user.kills || 0,
        deaths: user.deaths || 0,
        wins: user.wins || 0,
        games_played: user.games_played || 0
      }));

      res.json({
        type: 'kills',
        leaderboard: leaderboard
      });
    }
  );
});

// Leaderboard global por vitórias
router.get('/wins', (req, res) => {
  const limit = req.query.limit || 100;

  db.all(
    `SELECT u.id, u.username, u.level, u.avatar_url, gs.kills, gs.deaths, gs.wins, gs.games_played
     FROM users u
     LEFT JOIN game_stats gs ON u.id = gs.user_id
     ORDER BY gs.wins DESC
     LIMIT ?`,
    [limit],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar leaderboard' });
      }

      const leaderboard = (users || []).map((user, index) => ({
        rank: index + 1,
        user_id: user.id,
        username: user.username,
        level: user.level,
        avatar_url: user.avatar_url,
        kills: user.kills || 0,
        deaths: user.deaths || 0,
        wins: user.wins || 0,
        games_played: user.games_played || 0
      }));

      res.json({
        type: 'wins',
        leaderboard: leaderboard
      });
    }
  );
});

// Leaderboard global por nível
router.get('/level', (req, res) => {
  const limit = req.query.limit || 100;

  db.all(
    `SELECT u.id, u.username, u.level, u.exp, u.avatar_url, gs.kills, gs.wins, gs.games_played
     FROM users u
     LEFT JOIN game_stats gs ON u.id = gs.user_id
     ORDER BY u.level DESC, u.exp DESC
     LIMIT ?`,
    [limit],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar leaderboard' });
      }

      const leaderboard = (users || []).map((user, index) => ({
        rank: index + 1,
        user_id: user.id,
        username: user.username,
        level: user.level,
        exp: user.exp,
        avatar_url: user.avatar_url,
        kills: user.kills || 0,
        wins: user.wins || 0,
        games_played: user.games_played || 0
      }));

      res.json({
        type: 'level',
        leaderboard: leaderboard
      });
    }
  );
});

// Leaderboard de clãs
router.get('/clans', (req, res) => {
  const limit = req.query.limit || 100;

  db.all(
    `SELECT c.id, c.name, c.level, c.exp, c.members_count, u.username as leader_name
     FROM clans c
     JOIN users u ON c.leader_id = u.id
     ORDER BY c.level DESC, c.exp DESC
     LIMIT ?`,
    [limit],
    (err, clans) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar leaderboard de clãs' });
      }

      const leaderboard = (clans || []).map((clan, index) => ({
        rank: index + 1,
        clan_id: clan.id,
        clan_name: clan.name,
        level: clan.level,
        exp: clan.exp,
        members_count: clan.members_count,
        leader_name: clan.leader_name
      }));

      res.json({
        type: 'clans',
        leaderboard: leaderboard
      });
    }
  );
});

// Posição do usuário no leaderboard
router.get('/position/:userId', (req, res) => {
  const userId = req.params.userId;

  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    db.get('SELECT * FROM game_stats WHERE user_id = ?', [userId], (err, stats) => {
      db.all(
        'SELECT COUNT(*) as rank FROM game_stats WHERE kills > ?',
        [stats?.kills || 0],
        (err, result) => {
          res.json({
            user_id: userId,
            username: user.username,
            level: user.level,
            rank_by_kills: (result?.[0]?.rank || 0) + 1,
            kills: stats?.kills || 0,
            wins: stats?.wins || 0,
            games_played: stats?.games_played || 0
          });
        }
      );
    });
  });
});

module.exports = router;
