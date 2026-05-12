import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    payment: paymentSchema.optional(),
  }),
})((req, ctx) => {
  const paymentId = new URL(req.url).searchParams.get("payment_id")
  const payment = ctx.db.payments.find(
    (payment) => payment.payment_id === paymentId,
  )

  return ctx.json({ payment })
})
