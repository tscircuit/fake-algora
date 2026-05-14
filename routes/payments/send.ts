import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const sendPaymentBodySchema = z.object({
  recipient: z.string().min(1),
  amount_cents: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
  memo: z.string().optional(),
  idempotency_key: z.string().optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema,
    idempotent_replay: z.boolean(),
  }),
})(async (req, ctx) => {
  const paymentRequest = sendPaymentBodySchema.parse(await req.json())
  const existingPayment =
    paymentRequest.idempotency_key &&
    ctx.db.payments.find(
      (payment) => payment.idempotency_key === paymentRequest.idempotency_key,
    )

  const payment = ctx.db.sendPayment(paymentRequest)

  return ctx.json({
    payment,
    idempotent_replay: Boolean(existingPayment),
  })
})
