# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Payment API

Send a fake payment:

```ts
POST /payments/send
{
  "recipient": "maintainer@example.com",
  "amount_usd": 16.88,
  "memo": "Bounty reward",
  "idempotency_key": "claim-123"
}
```

The response includes the generated `payment_id`, a `sent` status, timestamps,
and `idempotent_replay: true` when the same idempotency key is submitted again.

List sent payments:

```ts
GET /payments/list
GET /payments/list?recipient=maintainer@example.com
```
