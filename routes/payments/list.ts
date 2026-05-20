import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: z.object({
    recipient: z.string().optional(),
    status: paymentStatusSchema.optional(),
    repository: z.string().optional(),
    bounty_id: z.string().optional(),
  }),
  jsonResponse: z.object({
    payments: z.array(paymentSchema),
  }),
})((req, ctx) => {
  const { recipient, status, repository, bounty_id } = req.query
  const payments = ctx.db.payments.filter((payment) => {
    if (recipient && payment.recipient !== recipient) return false
    if (status && payment.status !== status) return false
    if (repository && payment.repository !== repository) return false
    if (bounty_id && payment.bounty_id !== bounty_id) return false
    return true
  })

  return ctx.json({ payments })
})
