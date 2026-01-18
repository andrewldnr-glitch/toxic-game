import { getPool } from './_db.js';
import { validateInitData } from './_auth.js';

function clampNumber(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  return Math.min(max, Math.max(min, x));
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      return res.end('Method Not Allowed');
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const level = String(body?.level || '');
    const allowed = new Set(['easy','medium','hard','insane']);
    if (!allowed.has(level)) {
      res.statusCode = 400;
      return res.json({ error: 'Invalid level' });
    }

    const score = clampNumber(body?.score, 0, 10_000);
    const avgSec = clampNumber(body?.avgSec, 0, 60);
    const totalSec = clampNumber(body?.totalSec, 0, 60 * 60);
    if (score === null || avgSec === null || totalSec === null) {
      res.statusCode = 400;
      return res.json({ error: 'Invalid payload' });
    }

    const initData = String(body?.initData || '');
    const user = validateInitData(initData);
    if (!user) {
      res.statusCode = 401;
      return res.json({ error: 'Unauthorized' });
    }

    const pool = getPool();
    const userId = user.id ?? null;
    const username = user.username ?? null;
    const firstName = user.first_name ?? null;

    await pool.query(
      `insert into toxic_scores(level, user_id, username, first_name, score, avg_sec, total_sec)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [level, userId, username, firstName, Math.trunc(score), avgSec, totalSec]
    );

    res.setHeader('content-type','application/json; charset=utf-8');
    return res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    console.error(e);
    res.statusCode = 500;
    return res.json({ error: 'Server error' });
  }
}
