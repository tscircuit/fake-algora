import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const sendPaymentBodySchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(3).default("USD"),
  repository: z.string().min(1).optional(),
  issue_number: z.number().int().positive().optional(),
  bounty_id: z.string().min(1).optional(),
  idempotency_key: z.string().min(1).optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema,
    replayed: z.boolean(),
  }),
})(async (req, ctx) => {
  const result = ctx.db.sendPayment({
    ...req.jsonBody,
    currency: req.jsonBody.currency.toUpperCase(),
  })

  return ctx.json(result)
})
