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

  return ctx.json({
    payments: ctx.db.listPayments({
      status,
      recipient_email: url.searchParams.get("recipient_email") ?? undefined,
      repository: url.searchParams.get("repository") ?? undefined,
    }),
  })
})
