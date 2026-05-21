import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const errorResponseSchema = z.object({
  error: z.string(),
})

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.union([
    z.object({
      payment: paymentSchema,
    }),
    errorResponseSchema,
  ]),
})((req, ctx) => {
  const paymentId = new URL(req.url).searchParams.get("payment_id")

  if (!paymentId) {
    return Response.json({ error: "payment_id is required" }, { status: 400 })
  }

  const payment = ctx.db.getPayment(paymentId)

  if (!payment) {
    return Response.json({ error: "payment not found" }, { status: 404 })
  }

  return ctx.json({ payment })
})
