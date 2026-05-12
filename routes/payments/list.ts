import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentListResponseSchema,
  paymentQuerySchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: paymentListResponseSchema,
})(async (req, ctx) => {
  const url = new URL(req.url)
  const query = paymentQuerySchema.parse({
    status: url.searchParams.get("status") ?? undefined,
    recipient: url.searchParams.get("recipient") ?? undefined,
    repository: url.searchParams.get("repository") ?? undefined,
  })

  const payments = ctx.db.payments.filter((payment) => {
    if (query.status && payment.status !== query.status) return false
    if (query.recipient && payment.recipient !== query.recipient) return false
    if (query.repository && payment.repository !== query.repository)
      return false
    return true
  })

  return ctx.json({ ok: true, payments })
})
