# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Payments

- `POST /payments/send` creates a fake payment with recipient, amount, currency, and optional bounty issue.
- `GET /payments/list` returns the fake payments stored in memory.
