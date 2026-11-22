import { randomUUID } from 'node:crypto';
import { SignJWT, errors, jwtVerify } from 'jose';

// Maybe move to appsettings in later update
const ALG = 'HS256';
const ISSUER = 'bears-api';
const AUDIENCE = 'bears-web';

export interface TokenClaims {
  userId: string;
  jti: string;
  expiresAt: Date;
}

export class TokenService {
  private readonly key: Uint8Array;

  constructor(
    secret: string,
    private readonly ttlSeconds: number
  ) {
    this.key = new TextEncoder().encode(secret);
  }

  async issue(userId: string): Promise<string> {
    return await new SignJWT({})
      .setProtectedHeader({ alg: ALG, typ: 'JWT' })
      .setSubject(userId)
      .setJti(randomUUID())
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${this.ttlSeconds}s`)
      .sign(this.key);
  }

  // null = invalid: bad signature, wrong alg/iss/aud, expired
  async verify(token: string): Promise<TokenClaims | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: [ALG],
        issuer: ISSUER,
        audience: AUDIENCE,
      });
      const { sub, jti, exp } = payload;
      if (sub === undefined || jti === undefined || exp === undefined)
        return null;
      return { userId: sub, jti, expiresAt: new Date(exp * 1000) };
    } catch (err) {
      if (err instanceof errors.JOSEError) return null; // fail closed → 401
      throw err; // anything else is a bug → 500
    }
  }
}
