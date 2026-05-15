# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake Payments API

- `POST /payments/send` creates a pending fake payment.
- `GET /payments/list` lists payments, with optional `recipient_github_username` and `status` filters.
- `GET /payments/get?payment_id=...` fetches one payment.
- `POST /payments/complete`, `POST /payments/cancel`, and `POST /payments/fail` transition pending payments into final states.

`/payments/send` accepts an optional `idempotency_key`. Reusing the same key returns the original payment instead of creating a duplicate.
