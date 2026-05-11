import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.union([
    z.object({
      payment: paymentSchema,
    }),
    z.object({
      error: z.string(),
    }),
  ]),
})((req, ctx) => {
  const paymentId = new URL(req.url).searchParams.get("payment_id")
  const payment = ctx.db.payments.find(
    (candidate) => candidate.payment_id === paymentId,
  )

  if (!payment) {
    return ctx.json({ error: "Payment not found" }, { status: 404 })
  }

  return ctx.json({ payment })
})
