import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const sendPaymentBodySchema = z.object({
  recipient: z.string().min(1),
  amount_usd: z.number().positive(),
  currency: z.string().min(1).default("USD"),
  memo: z.string().optional(),
  bounty_id: z.string().optional(),
  repository: z.string().optional(),
  issue_number: z.number().int().positive().optional(),
  idempotency_key: z.string().min(1).optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema,
    created: z.boolean(),
  }),
})(async (req, ctx) => {
  const body = sendPaymentBodySchema.parse(await req.json())
  const result = ctx.db.sendPayment(body)

  return ctx.json(result)
})
