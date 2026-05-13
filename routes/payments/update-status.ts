import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const updatePaymentStatusRequestSchema = z.object({
  payment_id: z.string().min(1),
  status: paymentStatusSchema,
})

const updatePaymentStatusResponseSchema = z.union([
  z.object({
    ok: z.boolean(),
    payment: paymentSchema,
  }),
  z.object({
    error: z.string(),
  }),
])

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: updatePaymentStatusRequestSchema,
  jsonResponse: updatePaymentStatusResponseSchema,
})(async (req, ctx) => {
  const body = updatePaymentStatusRequestSchema.parse(await req.json())
  const payment = ctx.db.updatePaymentStatus(body.payment_id, body.status)

  if (!payment) {
    return ctx.json({ error: "payment not found" }, { status: 404 })
  }

  return ctx.json({ ok: true, payment })
})
