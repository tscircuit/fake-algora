# Fake Algora API

Small Winterspec API used to simulate Algora-style payments in tests and
development.

## Payments

### Send a payment

`POST /payments/send`

```json
{
  "recipient": "github:octocat",
  "amount_cents": 500,
  "currency": "USD",
  "memo": "Bounty payout",
  "idempotency_key": "issue-123"
}
```

Returns the created payment. If an `idempotency_key` has already been used, the
existing payment is returned instead of creating a duplicate.

### List payments

`GET /payments/list`

Returns all fake payments currently stored in memory.

### Get a payment

`GET /payments/get?payment_id=0`

Returns a single payment or `null` if it does not exist.

### Update payment status

`POST /payments/update-status`

```json
{
  "payment_id": "0",
  "status": "completed"
}
```

Valid statuses are `sent`, `completed`, `canceled`, and `failed`.
