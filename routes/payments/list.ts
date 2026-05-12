import { paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { listPaymentsResponseSchema } from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: listPaymentsResponseSchema,
})((req, ctx) => {
  const searchParams = new URL(req.url).searchParams
  const status = paymentStatusSchema.safeParse(searchParams.get("status"))

  const payments = ctx.db.listPayments({
    recipient: searchParams.get("recipient") ?? undefined,
    repository: searchParams.get("repository") ?? undefined,
    status: status.success ? status.data : undefined,
  })

  return ctx.json({ payments })
})
