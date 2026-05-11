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
  const issueNumber = url.searchParams.get("issue_number")
  const status = url.searchParams.get("status")

  const payments = ctx.db.listPayments({
    recipient: url.searchParams.get("recipient") ?? undefined,
    status: status ? paymentStatusSchema.parse(status) : undefined,
    owner: url.searchParams.get("owner") ?? undefined,
    repo: url.searchParams.get("repo") ?? undefined,
    issue_number: issueNumber ? Number(issueNumber) : undefined,
  })

  return ctx.json({ payments })
})
