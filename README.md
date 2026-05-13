# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake Payment API

The payment routes provide a small fake payment lifecycle for bounty payouts:

- `POST /payments/send` creates a pending payment. The body accepts `recipient`,
  `amount`, optional `currency`, optional bounty metadata, and an optional
  `idempotency_key` for retry-safe sends.
- `GET /payments/list` lists payments. Optional query filters: `recipient`,
  `repository`, and `status`.
- `GET /payments/get?payment_id=pay_1` returns one payment.
- `POST /payments/complete` marks a pending payment as completed.
- `POST /payments/cancel` marks a pending payment as canceled.
- `POST /payments/fail` marks a pending payment as failed.
