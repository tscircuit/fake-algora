# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payment API

The payment routes provide a small in-memory API for simulating bounty payouts.

### Send a payment

`POST /payments/send`

```json
{
  "recipient": "octocat",
  "amount": 10,
  "currency": "USD",
  "bounty_id": "fake-algora-1",
  "issue_number": 1,
  "repository": "tscircuit/fake-algora",
  "idempotency_key": "optional-retry-key"
}
```

### Read payments

- `GET /payments/list`
- `GET /payments/list?recipient=octocat&status=pending`
- `GET /payments/get?payment_id=0`

### Transition payments

- `POST /payments/complete`
- `POST /payments/cancel`
- `POST /payments/fail`

Each transition accepts:

```json
{
  "payment_id": "0"
}
```
