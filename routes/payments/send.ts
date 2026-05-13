import { z } from "zod"
import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"

export const sendPaymentBodySchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).default("USD"),
  memo: z.string().optional(),
  bounty_id: z.string().optional(),
  idempotency_key: z.string().optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema,
    idempotent: z.boolean(),
  }),
})(async (req, ctx) => {
  const body = await req.json()
  const beforeCount = ctx.db.payments.length
  const payment = ctx.db.createPayment(body)

  return ctx.json({
    payment,
    idempotent: ctx.db.payments.length === beforeCount,
  })
})
