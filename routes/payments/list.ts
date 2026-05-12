import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  listPaymentsQuerySchema,
  listPaymentsResponseSchema,
} from "lib/payments/route-schemas"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: listPaymentsQuerySchema,
  jsonResponse: listPaymentsResponseSchema,
})((req, ctx) => {
  return ctx.json({
    ok: true,
    payments: ctx.db.listPayments(req.query),
  })
})
