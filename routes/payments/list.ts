import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const paymentStatusSchema = z.enum([
  "pending",
  "completed",
  "canceled",
  "failed",
])

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    payments: z.array(
      z.object({
        payment_id: z.string(),
        recipient: z.string(),
        amount: z.number(),
        currency: z.string(),
        status: paymentStatusSchema,
        idempotency_key: z.string().optional(),
        bounty_issue: z.string().optional(),
        metadata: z.record(z.string(), z.string()),
        created_at: z.string(),
        updated_at: z.string(),
      }),
    ),
  }),
})(async (_req, ctx) => {
  const url = new URL(_req.url)
  const recipient = url.searchParams.get("recipient")
  const bountyIssue = url.searchParams.get("bounty_issue")
  const statusParam = url.searchParams.get("status")

  const parsedStatus = statusParam
    ? paymentStatusSchema.safeParse(statusParam)
    : null

  const payments = ctx.db.getState().payments.filter((payment) => {
    if (recipient && payment.recipient !== recipient) return false
    if (bountyIssue && payment.bounty_issue !== bountyIssue) return false
    if (parsedStatus?.success && payment.status !== parsedStatus.data)
      return false
    return true
  })

  return ctx.json({
    payments,
  })
})
