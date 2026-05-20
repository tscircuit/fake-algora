import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const statusBodySchema = z.object({
  payment_id: z.string().min(1),
})

const responseSchema = z.union([
  z.object({
    ok: z.literal(true),
    payment: paymentSchema,
  }),
  z.object({
    ok: z.literal(false),
    error: z.literal("payment_not_found"),
  }),
  z.object({
    ok: z.literal(false),
    error: z.literal("payment_not_pending"),
    payment: paymentSchema,
  }),
])

const jsonResponse = (body: z.infer<typeof responseSchema>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  })

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: statusBodySchema,
  jsonResponse: responseSchema,
})(async (req, ctx) => {
  const { payment_id } = statusBodySchema.parse(await req.json())
  const existingPayment = ctx.db.getPayment(payment_id)

  if (!existingPayment) {
    return jsonResponse({ ok: false, error: "payment_not_found" }, 404)
  }

  if (existingPayment.status !== "pending") {
    return jsonResponse(
      { ok: false, error: "payment_not_pending", payment: existingPayment },
      409,
    )
  }

  const payment = ctx.db.updatePaymentStatus(payment_id, "canceled")
  return jsonResponse({ ok: true, payment: payment! })
})
