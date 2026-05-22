import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const paymentStatusBodySchema = z.object({
  payment_id: z.string().min(1),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentStatusBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema,
  }),
})((req, ctx) => {
  const result = ctx.db.setPaymentStatus(req.jsonBody.payment_id, "canceled")
  if (!result) {
    return Response.json({ error: "Payment not found" }, { status: 404 })
  }
  if (!result.changed) {
    return Response.json(
      { error: `Payment is already ${result.payment.status}` },
      { status: 409 },
    )
  }

  return ctx.json({ payment: result.payment })
})
