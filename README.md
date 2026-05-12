# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake Payment API

The API includes an in-memory fake payment lifecycle for bounty payouts:

- `POST /payments/send` creates a pending payment. Include `recipient`, `amount`, `currency`, and optional `repository`, `issue_number`, `bounty_id`, or `idempotency_key`.
- `GET /payments/list` returns payments, optionally filtered by `status`, `recipient`, or `repository`.
- `POST /payments/get` accepts `payment_id` and returns one payment.
- `POST /payments/complete` marks a pending payment as completed.
- `POST /payments/cancel` marks a pending payment as canceled.

Repeated `/payments/send` calls with the same `idempotency_key` body field or `Idempotency-Key` header return the original payment instead of creating duplicates.
