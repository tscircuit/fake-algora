import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentListResponseSchema,
  paymentStatusQuerySchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: paymentStatusQuerySchema,
  jsonResponse: paymentListResponseSchema,
})((req, ctx) => {
  const { status, recipient, repository } = req.query
  const payments = ctx.db.payments.filter((payment) => {
    if (status && payment.status !== status) return false
    if (recipient && payment.recipient !== recipient) return false
    if (repository && payment.repository !== repository) return false
    return true
  })

  return ctx.json({ payments })
})
