# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payments

- `POST /payments/send` creates a pending fake payment and replays the same record when `idempotency_key` is reused.
- `GET /payments/list` lists payments, with optional `recipient`, `status`, and `bounty_issue` filters.
- `GET /payments/get?payment_id=...` returns one payment.
- `POST /payments/update-status` changes a payment to `pending`, `completed`, `canceled`, or `failed`.
