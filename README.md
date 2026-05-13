# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Payment API

The fake payment API can be used to simulate sending and tracking bounty
payments.

### Send a payment

```http
POST /payments/send
Content-Type: application/json

{
  "recipient": "maintainer@example.com",
  "amount_usd": 10,
  "bounty_id": "bounty_1",
  "repository": "tscircuit/fake-algora",
  "issue_number": 1,
  "idempotency_key": "claim-1"
}
```

The `idempotency_key` can also be provided with the `Idempotency-Key` header.
Repeating the same key returns the original payment with
`idempotent_replay: true` instead of creating a duplicate.

### Other endpoints

- `GET /payments/list` lists payments. Optional query filters: `status`,
  `recipient`, and `repository`.
- `GET /payments/get?payment_id=pay_0` returns one payment.
- `POST /payments/complete` marks a pending payment as completed.
- `POST /payments/cancel` marks a pending payment as canceled.
