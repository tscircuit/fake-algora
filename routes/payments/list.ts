import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentListQuerySchema,
  paymentListResponseSchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: paymentListQuerySchema,
  jsonResponse: paymentListResponseSchema,
})((req, ctx) => {
  const filters = paymentListQuerySchema.parse(req.query)

  return ctx.json({
    payments: ctx.db.listPayments(filters),
  })
})
