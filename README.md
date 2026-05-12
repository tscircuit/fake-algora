# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Payment API

The fake payment lifecycle supports the core bounty-payment flow:

- `POST /payments/send` creates a pending payment record. Include an optional
  `idempotency_key` to make retries return the original payment instead of
  creating duplicates.
- `GET /payments/list` returns payments, with optional `recipient`, `status`,
  and `repository` query filters.
- `GET /payments/get?payment_id=<id>` returns a single payment.
- `POST /payments/complete` marks a payment as completed.
- `POST /payments/cancel` marks a payment as canceled.
