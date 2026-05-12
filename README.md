# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payment API

The fake payment lifecycle is exposed through Winterspec routes:

- `POST /payments/send` creates a pending payment. It accepts
  `recipient_email`, `amount_cents`, `currency`, optional bounty metadata, and
  an optional `idempotency_key`.
- `GET /payments/list` lists payments. Optional query filters:
  `status`, `recipient_email`, and `repository`.
- `GET /payments/get?payment_id=...` returns one payment or `null`.
- `POST /payments/complete` marks a payment as completed.
- `POST /payments/cancel` marks a payment as canceled.

Repeated `POST /payments/send` calls with the same `idempotency_key` return the
existing payment with `idempotent_replay: true`.
