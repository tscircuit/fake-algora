# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake payments API

The app includes a small in-memory fake payment lifecycle for bounty-style
payment testing:

- `POST /payments/send` creates a pending payment. Body fields:
  `recipient`, `amount`, optional `currency`, `repository`, `issue_number`,
  `bounty_id`, and `idempotency_key`.
- `GET /payments/list` returns payments, with optional `recipient`,
  `repository`, `issue_number`, and `status` query filters.
- `GET /payments/get?payment_id=pay_0` returns one payment.
- `POST /payments/complete` marks a pending payment as completed.
- `POST /payments/cancel` marks a pending payment as canceled.

If `idempotency_key` is supplied to `/payments/send`, retries return the
original payment instead of creating a duplicate.
