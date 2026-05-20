# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payment API

The API includes an in-memory payment flow for testing bounty-like payment
lifecycle behavior.

- `POST /payments/send` creates a pending payment. The request accepts
  `recipient`, `amount`, optional `currency`, optional bounty metadata, and an
  optional `idempotency_key` for retry-safe replay.
- `GET /payments/list` returns payments and supports `recipient`, `status`,
  `repository`, `bounty_id`, and `issue_number` query filters.
- `GET /payments/get?payment_id=...` returns one payment or
  `payment_not_found`.
- `POST /payments/complete` marks a pending payment completed.
- `POST /payments/cancel` marks a pending payment canceled.

Completed and canceled payments cannot be transitioned again.
