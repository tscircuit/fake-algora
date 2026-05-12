import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const updatePaymentSchema = z.object({
  payment_id: z.string().min(1),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: updatePaymentSchema,
  jsonResponse: z.object({
    ok: z.boolean(),
    payment: z
      .object({
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
      })
      .nullable(),
    error: z.string().optional(),
  }),
})(async (req, ctx) => {
  const { payment_id } = updatePaymentSchema.parse(await req.json())
  const payment = ctx.db.findPaymentById(payment_id)
  if (!payment) {
    return ctx.json({
      ok: false,
      payment: null,
      error: "payment_not_found",
    })
  }

  ctx.db.updatePaymentStatus(payment_id, "canceled")

  return ctx.json({
    ok: true,
    payment: ctx.db.findPaymentById(payment_id)!,
  })
})
