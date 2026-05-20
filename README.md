# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake Payments API

The fake payment API can be used by local tests or demos that need a payment
lifecycle without talking to a real provider.

- `POST /payments/send` creates a fake payment. Send
  `recipient_email`, either `amount_cents` or `amount_usd`, and optional
  `currency`, `bounty_issue_url`, `note`, and `idempotency_key`.
- `GET /payments/list` returns payments. Optional filters:
  `recipient_email` and `status`.
- `GET /payments/get?payment_id=<id>` returns one payment.
- `POST /payments/complete`, `POST /payments/cancel`, and
  `POST /payments/fail` move a payment into a terminal state.

Repeated `POST /payments/send` calls with the same `idempotency_key` return the
original payment, which makes retrying a fake send safe.
