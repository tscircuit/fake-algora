import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: z.object({
    payment_id: z.string().min(1),
  }),
  jsonResponse: z.union([
    z.object({ payment: paymentSchema }),
    z.object({ error: z.string() }),
  ]),
})((req, ctx) => {
  const paymentId = new URL(req.url).searchParams.get("payment_id")
  const payment = ctx.db.payments.find(
    (existing) => existing.payment_id === paymentId,
  )

  if (!payment) {
    return new Response(JSON.stringify({ error: "Payment not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    })
  }

  return ctx.json({ payment })
})
