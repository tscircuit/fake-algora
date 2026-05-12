import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const sendPaymentBodySchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(3).max(8).default("USD"),
  bounty_id: z.string().min(1).optional(),
  issue_number: z.number().int().positive().optional(),
  repository: z.string().min(1).optional(),
  idempotency_key: z.string().min(1).optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentBodySchema,
  jsonResponse: z.object({
    ok: z.boolean(),
    idempotent_replay: z.boolean(),
    payment: paymentSchema,
  }),
})(async (req, ctx) => {
  const body = sendPaymentBodySchema.parse(await req.json())

  if (body.idempotency_key) {
    const existingPayment = ctx.db.findPaymentByIdempotencyKey(
      body.idempotency_key,
    )
    if (existingPayment) {
      return ctx.json({
        ok: true,
        idempotent_replay: true,
        payment: existingPayment,
      })
    }
  }

  const payment = ctx.db.addPayment({
    ...body,
    currency: body.currency.toUpperCase(),
  })

  return ctx.json({ ok: true, idempotent_replay: false, payment })
})
