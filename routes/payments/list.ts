import { paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { paymentListResponseSchema } from "./schema"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: paymentListResponseSchema,
})((req, ctx) => {
  const url = new URL(req.url)
  const recipient = url.searchParams.get("recipient_github_username")
  const status = url.searchParams.get("status")

  const payments = ctx.db.payments.filter((payment) => {
    if (recipient && payment.recipient_github_username !== recipient) {
      return false
    }

    if (status && paymentStatusSchema.safeParse(status).success) {
      return payment.status === status
    }

    return true
  })

  return ctx.json({ payments })
})
