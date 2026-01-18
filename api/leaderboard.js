import { getPool } from './_db.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.statusCode = 405;
      return res.end('Method Not Allowed');
    }

    const level = String(req.query.level || 'easy');
    const allowed = new Set(['easy','medium','hard','insane']);
    if (!allowed.has(level)) {
      res.statusCode = 400;
      return res.json({ error: 'Invalid level' });
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `select level, user_id, username, first_name, score, avg_sec, total_sec, created_at
       from toxic_scores
       where level = $1
       order by score desc, avg_sec asc, created_at desc
       limit 10`,
      [level]
    );

    res.setHeader('content-type','application/json; charset=utf-8');
    return res.end(JSON.stringify({ level, top: rows }));
  } catch (e) {
    console.error(e);
    res.statusCode = 500;
    return res.json({ error: 'Server error' });
  }
}
