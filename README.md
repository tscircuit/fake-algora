# Fake Algora API

Small Winterspec API for simulating Algora-style bounty payments in tests and
development.

## Payments

### Send a payment

`POST /payments/send`

```json
{
  "recipient": "github:octocat",
  "amount_cents": 1000,
  "currency": "USD",
  "memo": "Bounty payout",
  "idempotency_key": "issue-1-octocat"
}
```

Returns a fake payment with `status: "sent"`. Reusing the same
`idempotency_key` returns the original payment with `idempotent_replay: true`
instead of creating a duplicate.

### List payments

`GET /payments/list`

Optional filters:

- `recipient`
- `status`

### Get a payment

`GET /payments/get?payment_id=0`

Returns a single payment, or `null` when it does not exist.

### Complete or cancel a payment

`POST /payments/complete`

```json
{
  "payment_id": "0"
}
```

`POST /payments/cancel` accepts the same body shape.
