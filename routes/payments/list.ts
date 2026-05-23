import { paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { paymentsResponseSchema } from "lib/payments/response-schemas"
import { z } from "zod"

const listPaymentQuerySchema = z.object({
  recipient: z.string().optional(),
  repository: z.string().optional(),
  status: paymentStatusSchema.optional(),
})

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: paymentsResponseSchema,
})(async (req, ctx) => {
  const query = Object.fromEntries(new URL(req.url).searchParams.entries())
  const filters = listPaymentQuerySchema.parse(query)

  return ctx.json({
    payments: ctx.db.listPayments(filters),
  })
})
