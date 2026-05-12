# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake Payments API

- `POST /payments/send` creates a pending fake payment. It accepts `recipient`, `amount_usd`, optional `currency`, bounty metadata, and an optional `idempotency_key`.
- `GET /payments/list` returns payments and can filter by `recipient`, `status`, `repository`, and `issue_number`.
- `GET /payments/get?payment_id=payment_0` returns a single payment.
- `POST /payments/complete` marks a payment as completed.
- `POST /payments/cancel` marks a payment as cancelled.
