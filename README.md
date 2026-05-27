# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Payment API

The fake payment flow supports creating and tracking bounty payouts:

- `POST /payments/send` creates a pending payment. Send `recipient`, `amount`, optional `currency`, `idempotency_key`, `bounty_issue`, and `memo`.
- `GET /payments/list` returns payments and supports `recipient`, `status`, and `bounty_issue` filters.
- `GET /payments/get?payment_id=...` returns one payment or `null`.
- `POST /payments/update-status` updates a payment to `pending`, `completed`, `canceled`, or `failed`.

Repeated `/payments/send` requests with the same `idempotency_key` return the existing payment with `replayed: true`.
