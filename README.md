# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payment API

This project exposes a small fake payment API for exercising bounty and payout
flows without moving real funds.

### Send a payment

```http
POST /payments/send
Content-Type: application/json
```

```json
{
  "recipient": "octocat",
  "amount": 10,
  "currency": "USD",
  "bounty_id": "bounty_1",
  "issue_number": 1,
  "repository": "tscircuit/fake-algora",
  "idempotency_key": "optional-retry-key"
}
```

The response includes a `payment` object with `status: "pending"`. If an
`idempotency_key` is provided, repeat sends with the same key return the
existing payment instead of creating a duplicate.

### List payments

```http
GET /payments/list
GET /payments/list?recipient=octocat&status=pending
GET /payments/list?repository=tscircuit/fake-algora&status=completed
```

Supported filters are `recipient`, `repository`, and `status`.

### Get a payment

```http
GET /payments/get?payment_id=payment_0
```

### Complete, cancel, or fail a payment

```http
POST /payments/complete
POST /payments/cancel
POST /payments/fail
Content-Type: application/json
```

```json
{
  "payment_id": "payment_0"
}
```
