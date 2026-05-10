import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: z.object({
    recipient: z.string().optional(),
    bounty_id: z.string().optional(),
  }),
  jsonResponse: z.object({
    payments: z.array(paymentSchema),
  }),
})((req, ctx) => {
  const url = new URL(req.url)
  const payments = ctx.db.listPayments({
    recipient: url.searchParams.get("recipient") ?? undefined,
    bounty_id: url.searchParams.get("bounty_id") ?? undefined,
  })

  return ctx.json({ payments })
})
