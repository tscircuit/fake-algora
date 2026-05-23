import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentIdBodySchema,
  paymentOrErrorResponseSchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentIdBodySchema,
  jsonResponse: paymentOrErrorResponseSchema,
})(async (req, ctx) => {
  const { payment_id } = paymentIdBodySchema.parse(await req.json())
  const { payment, error } = ctx.db.updatePaymentStatus(payment_id, "canceled")

  if (error) {
    return Response.json(
      { error },
      { status: error === "payment_not_found" ? 404 : 409 },
    )
  }

  return ctx.json({ payment: payment! })
})
