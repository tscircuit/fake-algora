# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Payment Routes

- `POST /payments/send` - create a fake payment record
- `GET /payments/list` - list fake payment records
  - supports optional filters via query params: `recipient`, `bounty_issue`, `status`
- `POST /payments/get` - fetch a payment by id
- `POST /payments/complete` - mark a payment as completed
- `POST /payments/cancel` - mark a payment as canceled

## Payment Behavior

- `POST /payments/send` supports optional `idempotency_key` so retries do not duplicate payments
- status transitions are guarded:
  - only `pending` payments can be completed or canceled
  - non-pending transitions return `error: "invalid_status_transition"`
