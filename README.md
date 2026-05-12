# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payment API

The project includes a small in-memory fake payment lifecycle API:

- `POST /payments/send` creates a pending payment and supports
  `idempotency_key` for retry-safe sends.
- `GET /payments/list` lists payments and can filter by `recipient`,
  `repository`, and `status`.
- `GET /payments/get?payment_id=pay_0` fetches one payment.
- `POST /payments/complete` marks a pending payment as completed.
- `POST /payments/cancel` marks a pending payment as canceled.

Example send body:

```json
{
  "recipient": "maintainer@example.com",
  "amount": 10,
  "currency": "USD",
  "repository": "tscircuit/fake-algora",
  "issue_number": 1,
  "idempotency_key": "retry-safe-payment"
}
```
