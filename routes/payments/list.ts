import { z } from "zod"
import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: z.object({
    status: paymentStatusSchema.optional(),
    bounty_id: z.string().optional(),
  }),
  jsonResponse: z.object({
    payments: z.array(paymentSchema),
  }),
})((req, ctx) => {
  const url = new URL(req.url)
  const status = url.searchParams.get("status")
  const bountyId = url.searchParams.get("bounty_id")
  const payments = ctx.db.payments.filter((payment) => {
    if (status && payment.status !== status) return false
    if (bountyId && payment.bounty_id !== bountyId) return false
    return true
  })

  return ctx.json({ payments })
})
