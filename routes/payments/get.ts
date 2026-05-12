import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { paymentResponseOrErrorSchema } from "lib/payments/schemas"
import { z } from "zod"

const getPaymentQuerySchema = z.object({
  payment_id: z.string().min(1),
})

export default withRouteSpec({
  methods: ["GET"],
  queryParams: getPaymentQuerySchema,
  jsonResponse: paymentResponseOrErrorSchema,
})((req, ctx) => {
  const { payment_id } = getPaymentQuerySchema.parse(req.query)
  const payment = ctx.db.getPayment(payment_id)

  if (!payment) {
    return ctx.json(
      { ok: false, error: `Payment "${payment_id}" was not found` },
      { status: 404 },
    )
  }

  return ctx.json({ ok: true, payment })
})
