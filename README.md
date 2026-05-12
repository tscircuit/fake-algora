# Template API Project

This is a template project with best-practice modules:
- Winterspec for defining the API
- bun testing
- Zustand store with zod definition for database state

## Payment Routes

- `POST /payments/send` - create a fake payment record
- `GET /payments/list` - list fake payment records
- `POST /payments/get` - fetch a payment by id
- `POST /payments/complete` - mark a payment as completed
- `POST /payments/cancel` - mark a payment as canceled
