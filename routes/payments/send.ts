import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const paymentRequestSchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).default("USD"),
  idempotency_key: z.string().min(1).optional(),
  bounty_issue: z.string().min(1).optional(),
  memo: z.string().min(1).optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentRequestSchema,
  jsonResponse: z.object({
    payment: paymentSchema,
    replayed: z.boolean(),
  }),
})(async (req, ctx) => {
  const paymentInput = paymentRequestSchema.parse(await req.json())
  const { payment, replayed } = ctx.db.createPayment(paymentInput)

  return ctx.json({ payment, replayed })
})
