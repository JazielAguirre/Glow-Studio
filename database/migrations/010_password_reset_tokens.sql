-- ============================================================
-- Glow Studio — Migration 010: password_reset_tokens
--
-- Creates a table to store hashed password-reset tokens.
-- Raw tokens are never stored — only SHA-256 hashes.
-- Tokens expire after 30 minutes and are single-use.
-- ============================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id_reset    SERIAL PRIMARY KEY,
    id_usuario  INTEGER NOT NULL
                    REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    token_hash  VARCHAR(128) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    usado       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_prt_id_usuario  ON password_reset_tokens(id_usuario);
