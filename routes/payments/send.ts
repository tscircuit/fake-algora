import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const sendPaymentBodySchema = z.object({
  recipient: z.string().min(1),
  amount_cents: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
  bounty_issue_url: z.string().url().optional(),
  memo: z.string().optional(),
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
  const body = sendPaymentBodySchema.parse(await req.json())
  const result = ctx.db.sendPayment(body)

  return ctx.json(result)
})
