import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentResponseSchema,
  sendPaymentBodySchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentBodySchema,
  jsonResponse: paymentResponseSchema,
})(async (req, ctx) => {
  const input = sendPaymentBodySchema.parse(await req.json())

  if (input.idempotency_key) {
    const existingPayment = ctx.db.payments.find(
      (payment) => payment.idempotency_key === input.idempotency_key,
    )

    if (existingPayment) {
      return ctx.json({ ok: true, payment: existingPayment })
    }
  }

  const payment = ctx.db.addPayment(input)

  return ctx.json({ ok: true, payment })
})
