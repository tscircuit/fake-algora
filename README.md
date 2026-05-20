# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payments API

The fake payments routes model a small bounty payment lifecycle for local
testing:

- `POST /payments/send` creates a pending payment. Optional
  `idempotency_key` values replay the original payment for safe retries.
- `GET /payments/list` lists payments, with optional `recipient` and `status`
  query filters.
- `GET /payments/get?payment_id=...` returns one payment.
- `POST /payments/update-status` changes a pending payment to `completed`,
  `canceled`, or `failed`. Terminal payments keep their original status.
