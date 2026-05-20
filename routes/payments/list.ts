import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: z.object({
    recipient: z.string().optional(),
    status: paymentStatusSchema.optional(),
    bounty_issue: z.string().optional(),
  }),
  jsonResponse: z.object({
    payments: z.array(paymentSchema),
  }),
})((req, ctx) => {
  const url = new URL(req.url)
  const recipient = url.searchParams.get("recipient")
  const status = url.searchParams.get("status")
  const bountyIssue = url.searchParams.get("bounty_issue")

  const payments = ctx.db.payments.filter((payment) => {
    if (recipient && payment.recipient !== recipient) return false
    if (status && payment.status !== status) return false
    if (bountyIssue && payment.bounty_issue !== bountyIssue) return false
    return true
  })

  return ctx.json({ payments })
})
