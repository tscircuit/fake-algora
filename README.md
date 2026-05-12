# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payment API

The app exposes a small fake payment lifecycle API for testing bounty payout
flows without moving real money.

```bash
curl -X POST http://localhost:3000/payments/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "octocat",
    "amount": 10,
    "currency": "USD",
    "bounty_id": "1",
    "issue_number": 1,
    "repository": "tscircuit/fake-algora",
    "idempotency_key": "retry-safe-transfer"
  }'
```

Available routes:

- `POST /payments/send` creates a pending payment and reuses the existing
  payment when the same `idempotency_key` is sent again.
- `GET /payments/list` lists payments, optionally filtered by `recipient`,
  `status`, `repository`, or `bounty_id`.
- `GET /payments/get?payment_id=pay_0` returns one payment.
- `POST /payments/complete` marks a payment as completed.
- `POST /payments/cancel` marks a payment as cancelled.
- `POST /payments/fail` marks a payment as failed with an optional `reason`.
