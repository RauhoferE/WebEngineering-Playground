import argon2, { type HashOptions } from 'argon2';

const OPTIONS: HashOptions = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};
export async function hashPassword(pw: string): Promise<string> {
  return await argon2.hash(pw, OPTIONS);
}
export async function verifyPassword(
  hash: string,
  pw: string
): Promise<boolean> {
  return await argon2.verify(hash, pw);
}
