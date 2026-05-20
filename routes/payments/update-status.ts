import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    payment_id: z.string().min(1),
    status: paymentStatusSchema,
  }),
  jsonResponse: z.union([
    z.object({ payment: paymentSchema }),
    z.object({ error: z.string() }),
  ]),
})(async (req, ctx) => {
  const body = await req.json()
  const payment = ctx.db.updatePaymentStatus(body)

  if (!payment) {
    return new Response(JSON.stringify({ error: "Payment not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    })
  }

  return ctx.json({ payment })
})
