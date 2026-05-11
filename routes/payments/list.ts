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
  const status = searchParams.get("status") ?? undefined
  const parsedStatus = status ? paymentStatusSchema.parse(status) : undefined

  const payments = ctx.db.listPayments({
    status: parsedStatus,
    recipient: searchParams.get("recipient") ?? undefined,
    repository: searchParams.get("repository") ?? undefined,
    bounty_id: searchParams.get("bounty_id") ?? undefined,
  })

  return ctx.json({ payments })
})
