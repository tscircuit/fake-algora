# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payments API

The fake payment endpoints support a simple bounty payout lifecycle:

- `POST /payments/send` creates a pending payment. Optional `idempotency_key`
  values make retries safe for the same recipient.
- `GET /payments/list` lists payments and supports `recipient`, `status`, and
  `repository` query filters.
- `GET /payments/get?payment_id=<id>` returns one payment.
- `POST /payments/complete`, `POST /payments/cancel`, and `POST /payments/fail`
  transition pending payments into terminal states.

Example:

```bash
curl -X POST http://localhost:3000/payments/send \
  -H 'content-type: application/json' \
  -d '{"recipient":"agent@example.com","amount":10,"currency":"USD","idempotency_key":"issue-1-agent"}'
```
