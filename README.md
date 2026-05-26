# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake Payments API

The API includes an in-memory fake payment flow for bounty payout simulations.

- `POST /payments/send` creates a pending payment.
- `GET /payments/list` lists payments, optionally filtered by `recipient`, `repository`, `bounty_issue`, or `status`.
- `GET /payments/get?payment_id=...` returns a single payment.
- `POST /payments/update-status` updates a payment to `pending`, `completed`, `failed`, or `canceled`.

`POST /payments/send` accepts an optional `idempotency_key`. Reusing the same key returns the original payment with `idempotent_replay: true`, so callers can retry safely without creating duplicate fake transfers.
