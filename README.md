# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Fake Payment API

This project includes a fake payment API for exercising bounty payout flows
without moving real money.

### Send a payment

```http
POST /payments/send
```

```json
{
  "recipient": "maintainer@example.com",
  "amount": 10,
  "currency": "USD",
  "owner": "tscircuit",
  "repo": "fake-algora",
  "repository": "tscircuit/fake-algora",
  "issue_number": 1,
  "bounty_id": "bounty_123",
  "idempotency_key": "retry-safe-payment"
}
```

The response includes the fake `payment` and an `idempotent` boolean. Reusing
the same `idempotency_key` returns the original payment instead of creating a
duplicate.

### Read payments

```http
GET /payments/get?payment_id=0
GET /payments/list?recipient=maintainer@example.com&status=pending
GET /payments/list?owner=tscircuit&repo=fake-algora&issue_number=1
```

List filters support `recipient`, `status`, `owner`, `repo`, `repository`,
`bounty_id`, and `issue_number`.

### Update payment status

```http
POST /payments/complete
POST /payments/cancel
POST /payments/fail
```

```json
{ "payment_id": "0" }
```

Cancel and fail also accept `cancel_reason` and `failure_reason` respectively.
