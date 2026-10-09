import fs from 'fs';
import path from 'path';

export const AUTH_FILE = path.join(__dirname, '../../.auth/user.json');

export function credentials() {
  const email = process.env.KUMPARAN_EMAIL;
  const password = process.env.KUMPARAN_PASSWORD;
  if (!email || !password) {
    throw new Error('KUMPARAN_EMAIL and KUMPARAN_PASSWORD must be set in .env (see .env.example)');
  }
  return { email, password };
}

export function hasSavedSession() {
  return fs.existsSync(AUTH_FILE);
}
