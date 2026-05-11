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
  const statusParam = url.searchParams.get("status")
  const status = statusParam
    ? paymentStatusSchema.parse(statusParam)
    : undefined

  const payments = ctx.db.listPayments({
    recipient: url.searchParams.get("recipient") ?? undefined,
    repository: url.searchParams.get("repository") ?? undefined,
    status,
  })

  return ctx.json({ payments })
})
