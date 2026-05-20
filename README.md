# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payment API

The payment routes simulate Algora reward transfers in the in-memory store.

### Send a payment

```bash
curl -X POST http://localhost:3000/payments/send \
  -H "content-type: application/json" \
  -H "idempotency-key: reward-pr-123" \
  -d '{
    "recipient": "contributor@example.com",
    "amount": 10,
    "currency": "usd",
    "repository": "tscircuit/fake-algora",
    "issue_number": 1,
    "bounty_id": "bounty_1"
  }'
```

`POST /payments/send` returns a `pending` payment. Reusing the same
`idempotency-key` header or `idempotency_key` body value returns the original
payment with `idempotent_replay: true`.

### Read and transition payments

- `GET /payments/list`
- `GET /payments/list?status=pending&repository=tscircuit%2Ffake-algora`
- `GET /payments/get?payment_id=pay_0`
- `POST /payments/complete` with `{ "payment_id": "pay_0" }`
- `POST /payments/cancel` with `{ "payment_id": "pay_0" }`
