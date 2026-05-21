# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payment API

The fake payment routes are in-memory only and do not contact a payment
provider.

- `POST /payments/send` creates a pending fake payment.
- `GET /payments/list` lists fake payments, with optional `recipient`,
  `status`, and `bounty_issue` query filters.
- `GET /payments/get?payment_id=pay_0` fetches one fake payment.
- `POST /payments/update-status` moves a pending fake payment to `completed`,
  `canceled`, or `failed`.

`/payments/send` accepts an optional `idempotency_key` body field or
`Idempotency-Key` header. Reusing the same key returns the original fake payment
instead of creating a duplicate record.
