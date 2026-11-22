import argon2, { type HashOptions } from 'argon2';
import { randomUUID } from 'node:crypto';

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

// used when the e-mail is unknown, so both failure paths cost one argon2 verify
let dummy: Promise<string> | undefined;
export async function dummyHash(): Promise<string> {
  dummy ??= hashPassword(randomUUID());
  return await dummy;
}
