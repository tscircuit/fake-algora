import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    recipient: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string().min(1).default("USD"),
    bounty_id: z.string().optional(),
    issue_number: z.number().int().positive().optional(),
    repository: z.string().optional(),
    idempotency_key: z.string().optional(),
  }),
  jsonResponse: z.object({
    ok: z.boolean(),
    payment: paymentSchema,
  }),
})(async (req, ctx) => {
  const {
    recipient,
    amount,
    currency = "USD",
    bounty_id,
    issue_number,
    repository,
    idempotency_key,
  } = await req.json()

  const payment = ctx.db.sendPayment({
    recipient,
    amount,
    currency,
    bounty_id,
    issue_number,
    repository,
    idempotency_key,
  })

  return ctx.json({ ok: true, payment })
})
