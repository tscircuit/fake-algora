import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const getPaymentQuerySchema = z.object({
  payment_id: z.string().min(1),
})

export default withRouteSpec({
  methods: ["GET"],
  queryParams: getPaymentQuerySchema,
  jsonResponse: z.object({
    payment: paymentSchema,
  }),
})((req, ctx) => {
  const payment = ctx.db.getPayment(req.query.payment_id)
  if (!payment) {
    return Response.json({ error: "Payment not found" }, { status: 404 })
  }

  return ctx.json({ payment })
})
