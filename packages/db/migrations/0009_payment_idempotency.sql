-- 0009_payment_idempotency.sql
-- Payments must be safe to retry: enforce per-school idempotency keys at the DB level.
-- Partial index keeps NULL keys (gateway/unspecified payments) exempt.

CREATE UNIQUE INDEX IF NOT EXISTS payments_school_idempotency_key_uq
  ON payments (school_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
