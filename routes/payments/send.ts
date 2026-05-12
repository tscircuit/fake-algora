import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const sendPaymentBodySchema = z.object({
  recipient_email: z.string().email(),
  amount_cents: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
  idempotency_key: z.string().min(1).optional(),
  bounty_id: z.string().min(1).optional(),
  repository: z.string().min(1).optional(),
  issue_number: z.number().int().positive().optional(),
  memo: z.string().min(1).optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema,
    idempotent_replay: z.boolean(),
  }),
})(async (req, ctx) => {
  const body = sendPaymentBodySchema.parse(await req.json())

  if (body.idempotency_key) {
    const existingPayment = ctx.db.getPaymentByIdempotencyKey(
      body.idempotency_key,
    )
    if (existingPayment) {
      return ctx.json({ payment: existingPayment, idempotent_replay: true })
    }
  }

  const payment = ctx.db.createPayment(body)
  return ctx.json({ payment, idempotent_replay: false })
})
