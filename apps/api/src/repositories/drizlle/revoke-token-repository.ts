import { eq, lt } from 'drizzle-orm';
import type { Executor } from '../../db/client.js';
import { revokedTokens } from '../../db/schema.js';
import type { RevokedTokenRepository } from '../revoke-token-repository.js';

export class DrizzleRevokeTokenRepository implements RevokedTokenRepository {
  constructor(private readonly db: Executor) {}

  async revoke(jti: string, expiresAt: Date): Promise<void> {
    await this.db
      .insert(revokedTokens)
      .values({ jti, expiresAt })
      .onConflictDoNothing();
    // Rows past exp are useless: such a token fails verification anyway
    await this.db
      .delete(revokedTokens)
      .where(lt(revokedTokens.expiresAt, new Date()));
  }

  async isRevoked(jti: string): Promise<boolean> {
    const [row] = await this.db
      .select({ jti: revokedTokens.jti })
      .from(revokedTokens)
      .where(eq(revokedTokens.jti, jti));
    return row !== undefined;
  }
}
