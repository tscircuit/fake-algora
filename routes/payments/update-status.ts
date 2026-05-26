import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const updatePaymentStatusBodySchema = z.object({
  payment_id: z.string(),
  status: paymentStatusSchema,
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: updatePaymentStatusBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema,
  }),
})(async (req, ctx) => {
  const { payment_id, status } = updatePaymentStatusBodySchema.parse(
    await req.json(),
  )
  const payment = ctx.db.updatePaymentStatus(payment_id, status)

  if (!payment) {
    return new Response(JSON.stringify({ error: "Payment not found" }), {
      status: 404,
      headers: {
        "content-type": "application/json",
      },
    })
  }

  return ctx.json({ payment })
})
