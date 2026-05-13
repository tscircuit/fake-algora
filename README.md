# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payments API

The project includes a small in-memory payment API suitable for fake bounty/payment flows:

- `POST /payments/send` — create a pending fake payment. Supports `idempotency_key` so retries return the original payment.
- `GET /payments/list` — list payments, optionally filtered by `status` or `bounty_id`.
- `GET /payments/get?payment_id=...` — fetch a single payment.
- `POST /payments/update-status` — update a payment to `pending`, `completed`, `cancelled`, or `failed`.

Example send body:

```json
{
  "recipient": "maintainer@example.com",
  "amount": 10,
  "currency": "USD",
  "bounty_id": "tscircuit/fake-algora#1",
  "idempotency_key": "bounty-1-payment"
}
```
