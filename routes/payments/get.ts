import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const getPaymentQuerySchema = z.object({
  payment_id: z.string().min(1),
})

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})((req, ctx) => {
  const url = new URL(req.url)
  const query = getPaymentQuerySchema.parse({
    payment_id: url.searchParams.get("payment_id") ?? undefined,
  })

  return ctx.json({ payment: ctx.db.getPayment(query.payment_id) })
})
