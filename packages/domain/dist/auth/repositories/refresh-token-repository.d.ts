/**
 * Minimal data shape for a stored refresh token.
 * Not a full domain entity — just the data needed for validation.
 */
export interface RefreshTokenRecord {
    token: string;
    userId: string;
    expiresAt: Date;
    createdAt?: Date;
}
export interface RefreshTokenRepository {
    /**
     * Persists a new refresh token.
     */
    save(record: RefreshTokenRecord): Promise<void>;
    /**
     * Looks up a refresh token by its JWT string value.
     * Returns null if the token was never issued or has been revoked (deleted).
     */
    findByToken(token: string): Promise<RefreshTokenRecord | null>;
    /**
     * Deletes all refresh tokens for a given user — used on logout
     * to revoke all active sessions.
     */
    deleteByUserId(userId: string): Promise<void>;
    /**
     * Deletes all expired refresh tokens — used as a cleanup/cron operation.
     */
    deleteExpired(): Promise<void>;
}
//# sourceMappingURL=refresh-token-repository.d.ts.map