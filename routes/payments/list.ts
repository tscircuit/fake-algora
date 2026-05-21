import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    payments: z.array(paymentSchema),
  }),
})((req, ctx) => {
  const params = new URL(req.url).searchParams
  const recipient = params.get("recipient")
  const bountyIssue = params.get("bounty_issue")
  const status = paymentStatusSchema.safeParse(params.get("status"))

  const payments = ctx.db.payments.filter((payment) => {
    if (recipient && payment.recipient !== recipient) {
      return false
    }

    if (bountyIssue && payment.bounty_issue !== bountyIssue) {
      return false
    }

    if (status.success && payment.status !== status.data) {
      return false
    }

    return true
  })

  return ctx.json({ payments })
})
