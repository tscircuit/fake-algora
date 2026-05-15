import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    recipient_email: z.string().email(),
    amount_usd: z.number().positive(),
    note: z.string().optional(),
  }),
  jsonResponse: z.object({
    ok: z.boolean(),
    payment: z.object({
      payment_id: z.string(),
      recipient_email: z.string(),
      amount_usd: z.number(),
      note: z.string().optional(),
      status: z.enum(["pending", "sent", "failed"]),
      created_at: z.string(),
      sent_at: z.string().optional(),
    }),
  }),
})(async (req, ctx) => {
  const { recipient_email, amount_usd, note } = await req.json()

  ctx.db.addPayment({ recipient_email, amount_usd, note })

  const payments = ctx.db.getState().payments
  const payment = payments[payments.length - 1]

  // Simulate async send: immediately mark as sent in fake mode
  ctx.db.updatePaymentStatus(
    payment.payment_id,
    "sent",
    new Date().toISOString(),
  )

  const sent = ctx.db
    .getState()
    .payments.find((p) => p.payment_id === payment.payment_id)!

  return ctx.json({ ok: true, payment: sent })
})
