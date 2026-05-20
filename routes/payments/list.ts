import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    payments: z.array(paymentSchema),
  }),
})((req, ctx) => {
  const searchParams = new URL(req.url).searchParams
  const statusParam = searchParams.get("status")
  const status = statusParam
    ? paymentStatusSchema.parse(statusParam)
    : undefined

  const payments = ctx.db.listPayments({
    recipient: searchParams.get("recipient") ?? undefined,
    status,
    repository: searchParams.get("repository") ?? undefined,
    bounty_id: searchParams.get("bounty_id") ?? undefined,
    issue_number: searchParams.get("issue_number") ?? undefined,
  })

  return ctx.json({ payments })
})
