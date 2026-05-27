import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    payments: z.array(paymentSchema),
  }),
})((req, ctx) => {
  const url = new URL(req.url)
  const recipient = url.searchParams.get("recipient")
  const bountyIssue = url.searchParams.get("bounty_issue")
  const status = paymentStatusSchema
    .optional()
    .safeParse(url.searchParams.get("status") ?? undefined)

  const payments = ctx.db.payments.filter((payment) => {
    if (recipient && payment.recipient !== recipient) {
      return false
    }

    if (bountyIssue && payment.bounty_issue !== bountyIssue) {
      return false
    }

    if (status.success && status.data && payment.status !== status.data) {
      return false
    }

    return true
  })

  return ctx.json({ payments })
})
