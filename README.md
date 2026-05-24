# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake Payments

The payment API keeps in-memory payment records for bounty payouts:

- `POST /payments/send` creates a pending payment and supports `idempotency_key` for retry-safe sends.
- `GET /payments/list` lists payments, with optional `recipient`, `status`, `bounty_issue`, and `repository` filters.
- `GET /payments/get?payment_id=...` returns a single payment.
- `POST /payments/complete` marks a pending payment as completed.
- `POST /payments/cancel` marks a pending payment as canceled.
