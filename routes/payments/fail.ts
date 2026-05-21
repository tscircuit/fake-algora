import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentErrorResponseSchema,
  paymentResponseSchema,
} from "lib/payments/response-schemas"
import { z } from "zod"

const paymentStatusRequestSchema = z.object({
  payment_id: z.string().min(1),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentStatusRequestSchema,
  jsonResponse: paymentResponseSchema.or(paymentErrorResponseSchema),
})(async (req, ctx) => {
  const { payment_id } = paymentStatusRequestSchema.parse(await req.json())
  const payment = ctx.db.updatePaymentStatus(payment_id, "failed")

  if (!payment) {
    return ctx.json({ error: "Payment not found" }, { status: 404 })
  }

  return ctx.json({ payment })
})
