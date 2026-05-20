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
  const recipient = url.searchParams.get("recipient")
  const status = paymentStatusSchema
    .optional()
    .parse(url.searchParams.get("status") ?? undefined)

  const payments = ctx.db.payments.filter((payment) => {
    if (recipient && payment.recipient !== recipient) {
      return false
    }
    if (status && payment.status !== status) {
      return false
    }
    return true
  })

  return ctx.json({ payments })
})
