import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: z.object({
    recipient: z.string().optional(),
    status: paymentStatusSchema.optional(),
    repository: z.string().optional(),
  }),
  jsonResponse: z.object({
    payments: z.array(paymentSchema),
  }),
})((req, ctx) => {
  const { recipient, status, repository } = req.query
  const payments = ctx.db.payments.filter((payment) => {
    return (
      (!recipient || payment.recipient === recipient) &&
      (!status || payment.status === status) &&
      (!repository || payment.repository === repository)
    )
  })
  return ctx.json({ payments })
})
