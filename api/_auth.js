import { isValid, parse } from '@tma.js/init-data-node';

/**
 * Validates initData and returns parsed user object (or null).
 * Requires BOT_TOKEN env var.
 */
export function validateInitData(initData) {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error('BOT_TOKEN is not set');

  const ok = isValid(initData, token, { expiresIn: 60 * 60 }); // 1h freshness window
  if (!ok) return null;

  const data = parse(initData);
  return data?.user || null;
}
