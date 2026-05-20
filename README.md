# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payment API

The fake payment routes are intentionally in-memory and safe for local testing:

- `POST /payments/send` creates a pending fake payment and accepts optional bounty metadata.
- `GET /payments/list` lists payments, with optional `recipient`, `repository`, and `status` filters.
- `GET /payments/get?payment_id=...` returns one payment.
- `POST /payments/complete` marks a pending payment as completed.
- `POST /payments/cancel` marks a pending payment as canceled.

`POST /payments/send` also supports an optional `idempotency_key` so retrying the
same fake payment request does not create duplicate records.
