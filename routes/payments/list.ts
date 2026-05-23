import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { paymentListResponseSchema } from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: paymentListResponseSchema,
})((req, ctx) => {
  const url = new URL(req.url)
  const recipient = url.searchParams.get("recipient")
  const status = url.searchParams.get("status")
  const repository = url.searchParams.get("repository")

  const payments = ctx.db.payments.filter((payment) => {
    if (recipient && payment.recipient !== recipient) return false
    if (status && payment.status !== status) return false
    if (repository && payment.repository !== repository) return false
    return true
  })

  return ctx.json({ payments })
})
