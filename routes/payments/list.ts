import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentListResponseSchema,
  paymentStatusSchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: paymentListResponseSchema,
})((req, ctx) => {
  const url = new URL(req.url)
  const status = paymentStatusSchema
    .nullable()
    .catch(null)
    .parse(url.searchParams.get("status"))

  const payments = ctx.db.listPayments({
    recipient_email: url.searchParams.get("recipient_email"),
    status,
  })

  return ctx.json({ payments })
})
