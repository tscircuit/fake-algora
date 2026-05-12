# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payment API

- `POST /payments/send` creates a pending fake payment. The body accepts
  `recipient_email`, `amount_cents`, optional `currency`, bounty metadata, and an
  optional `idempotency_key` for retry-safe sends.
- `GET /payments/list` returns payments. It can filter by `status`,
  `recipient_email`, and `repository`.
- `GET /payments/get?payment_id=...` returns one payment or `404`.
- `POST /payments/complete` marks a pending payment as completed.
- `POST /payments/cancel` marks a pending payment as canceled.

Completed and canceled payments are terminal; later status changes return `409`.
