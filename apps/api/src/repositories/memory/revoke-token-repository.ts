import type { RevokedTokenRepository } from '../revoke-token-repository.js';

export class MemoryRevokeTokenRepository implements RevokedTokenRepository {
  private readonly revokedTokens = new Set<string>();

  async revoke(jti: string, expiresAt: Date): Promise<void> {
    this.revokedTokens.add(jti);
  }

  async isRevoked(jti: string): Promise<boolean> {
    return this.revokedTokens.has(jti);
  }
}
