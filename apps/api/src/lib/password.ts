import bcrypt from 'bcrypt';

// 12 rounds: bcrypt's own recommended floor for 2024+ hardware, balancing
// hash cost (~250ms) against not making every login request noticeably
// slow.
const SALT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
