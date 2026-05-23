import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentErrorResponseSchema,
  paymentResponseSchema,
} from "lib/payments/response-schemas"
import { z } from "zod"

const getPaymentQuerySchema = z.object({
  payment_id: z.string().min(1),
})

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: paymentResponseSchema.or(paymentErrorResponseSchema),
})(async (req, ctx) => {
  const query = Object.fromEntries(new URL(req.url).searchParams.entries())
  const { payment_id } = getPaymentQuerySchema.parse(query)
  const payment = ctx.db.getPayment(payment_id)

  if (!payment) {
    return ctx.json({ error: "Payment not found" }, { status: 404 })
  }

  return ctx.json({ payment })
})
