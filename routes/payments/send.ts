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
type SendPaymentBody = z.infer<typeof sendPaymentBodySchema>

const hasSameIdempotentPayload = (
  existingPayment: {
    recipient: string
    amount: number
    currency: string
    bounty_issue?: string
    metadata: Record<string, string>
  },
  incomingPayment: SendPaymentBody,
) => {
  if (existingPayment.recipient !== incomingPayment.recipient) return false
  if (existingPayment.amount !== incomingPayment.amount) return false
  if (existingPayment.currency !== incomingPayment.currency) return false
  if (existingPayment.bounty_issue !== incomingPayment.bounty_issue)
    return false

  const existingMetadata = existingPayment.metadata
  const incomingMetadata = incomingPayment.metadata ?? {}

  if (
    Object.keys(existingMetadata).length !==
    Object.keys(incomingMetadata).length
  )
    return false

  for (const [key, value] of Object.entries(incomingMetadata)) {
    if (existingMetadata[key] !== value) return false
  }

  return true
}

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
    error: z.string().optional(),
  }),
})(async (req, ctx) => {
  const body = sendPaymentBodySchema.parse(await req.json())

  if (body.idempotency_key) {
    const existing = ctx.db.findPaymentByIdempotencyKey(body.idempotency_key)
    if (existing) {
      if (!hasSameIdempotentPayload(existing, body)) {
        return ctx.json({
          ok: false,
          payment: existing,
          error: "idempotency_key_reused_with_different_payload",
        })
      }

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
