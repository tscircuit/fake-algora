# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake Payments API

The fake payment routes model the lifecycle needed by bounty-style flows without
contacting a real payment provider.

- `POST /payments/send`: create a pending fake payment. Accepts `recipient`,
  `amount`, optional `currency`, bounty metadata, and optional
  `idempotency_key`.
- `GET /payments/list`: list payments, optionally filtered by `recipient`,
  `repository`, or `status`.
- `GET /payments/get?payment_id=pay_0`: fetch one payment by id.
- `POST /payments/complete`: mark a pending payment as completed.

When `idempotency_key` is supplied to `/payments/send`, repeated requests return
the original payment with `idempotent_replay: true` instead of creating duplicate
fake transfers.
