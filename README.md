# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payments API

The payments API stores fake payment records in memory and supports a small
payment lifecycle:

- `POST /payments/send` creates a pending payment. Reusing an
  `idempotency_key` returns the existing payment instead of creating a
  duplicate.
- `GET /payments/list` returns payments and can filter by `recipient`,
  `repository`, or `status`.
- `GET /payments/get?payment_id=0` returns a payment by id.
- `POST /payments/update-status` moves a pending payment to `completed`,
  `canceled`, or `failed`. Terminal payments cannot be changed again.
