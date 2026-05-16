import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const sendPaymentBodySchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  idempotency_key: z.string().trim().min(1).optional(),
  bounty_issue: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentBodySchema,
  jsonResponse: z.object({
    ok: z.boolean(),
    payment: z.object({
      payment_id: z.string(),
      recipient: z.string(),
      amount: z.number(),
      currency: z.string(),
      status: z.enum(["pending", "completed", "canceled", "failed"]),
      idempotency_key: z.string().optional(),
      bounty_issue: z.string().optional(),
      metadata: z.record(z.string(), z.string()),
      created_at: z.string(),
      updated_at: z.string(),
    }),
    idempotent_replay: z.boolean().optional(),
  }),
})(async (req, ctx) => {
  const body = sendPaymentBodySchema.parse(await req.json())

  if (body.idempotency_key) {
    const existing = ctx.db.findPaymentByIdempotencyKey(body.idempotency_key)
    if (existing) {
      return ctx.json({
        ok: true,
        payment: existing,
        idempotent_replay: true,
      })
    }
  }

  ctx.db.addPayment(body)
  const payment = body.idempotency_key
    ? ctx.db.findPaymentByIdempotencyKey(body.idempotency_key)
    : ctx.db.getState().payments.at(-1)

  return ctx.json({
    ok: true,
    payment: payment!,
  })
})
