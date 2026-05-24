# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Payment API

The fake Algora payment flow is exposed through small Winterspec routes backed
by the in-memory Zustand database.

- `POST /payments/send` creates a pending payment and supports
  `idempotency_key` replay protection.
- `GET /payments/list` returns payments, optionally filtered by `recipient` or
  `status`.
- `GET /payments/get?payment_id=...` returns one payment or `null`.
- `POST /payments/complete` marks a pending payment as completed.
- `POST /payments/cancel` marks a pending payment as canceled.
