import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const errorResponseSchema = z.object({
  error: z.string(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    payment_id: z.string().min(1),
    status: paymentStatusSchema,
  }),
  jsonResponse: z.union([
    z.object({
      payment: paymentSchema,
    }),
    errorResponseSchema,
  ]),
})(async (req, ctx) => {
  const { payment_id, status } = await req.json()
  const payment = ctx.db.getPayment(payment_id)

  if (!payment) {
    return Response.json({ error: "payment not found" }, { status: 404 })
  }

  if (payment.status !== "pending") {
    return Response.json(
      { error: "only pending payments can change status" },
      { status: 409 },
    )
  }

  const updatedPayment = ctx.db.updatePaymentStatus(payment_id, status)

  if (!updatedPayment) {
    return Response.json({ error: "payment not found" }, { status: 404 })
  }

  return ctx.json({ payment: updatedPayment })
})
