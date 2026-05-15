import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const paymentResponseSchema = z.object({
  payment_id: z.string(),
  recipient: z.string(),
  amount_usd: z.number(),
  memo: z.string().optional(),
  idempotency_key: z.string().optional(),
  status: z.enum(["sent", "failed"]),
  created_at: z.string(),
  sent_at: z.string().optional(),
  failure_reason: z.string().optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    recipient: z.string().min(1),
    amount_usd: z.number().positive(),
    memo: z.string().optional(),
    idempotency_key: z.string().min(1).optional(),
  }),
  jsonResponse: z.object({
    ok: z.boolean(),
    payment: paymentResponseSchema,
    idempotent_replay: z.boolean(),
  }),
})(async (req, ctx) => {
  const { recipient, amount_usd, memo, idempotency_key } = await req.json()
  const result = ctx.db.sendPayment({
    recipient,
    amount_usd,
    memo,
    idempotency_key,
  })

  return ctx.json({ ok: true, ...result })
})
