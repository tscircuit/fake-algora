import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const sendPaymentBodySchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(3).default("USD"),
  repository: z.string().optional(),
  bounty_issue: z.string().optional(),
  idempotency_key: z.string().optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentBodySchema,
  jsonResponse: z.object({
    idempotent_replay: z.boolean(),
    payment: paymentSchema,
  }),
})(async (req, ctx) => {
  const body = sendPaymentBodySchema.parse(await req.json())

  if (body.idempotency_key) {
    const existingPayment = ctx.db.payments.find(
      (payment) => payment.idempotency_key === body.idempotency_key,
    )

    if (existingPayment) {
      return ctx.json({
        idempotent_replay: true,
        payment: existingPayment,
      })
    }
  }

  const payment = ctx.db.addPayment(body)

  return ctx.json({
    idempotent_replay: false,
    payment,
  })
})
