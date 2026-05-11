import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    recipient: z.string(),
    amount: z.number().positive(),
    currency: z.string().default("USD"),
    repository: z.string().optional(),
    issue_number: z.number().optional(),
    idempotency_key: z.string().optional(),
  }),
  jsonResponse: z.object({
    payment: paymentSchema,
  }),
})(async (req, ctx) => {
  const paymentRequest = await req.json()

  if (paymentRequest.idempotency_key) {
    const existingPayment = ctx.db.findPaymentByIdempotencyKey(
      paymentRequest.idempotency_key,
    )
    if (existingPayment) {
      return ctx.json({ payment: existingPayment })
    }
  }

  const payment = ctx.db.addPayment(paymentRequest)

  return ctx.json({ payment })
})
