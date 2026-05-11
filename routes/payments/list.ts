import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    payments: z.array(paymentSchema),
  }),
})((req, ctx) => {
  const searchParams = new URL(req.url).searchParams
  const status = paymentStatusSchema
    .optional()
    .parse(searchParams.get("status") ?? undefined)
  const recipient = searchParams.get("recipient") ?? undefined
  const repository = searchParams.get("repository") ?? undefined

  const payments = ctx.db.payments.filter((payment) => {
    if (status && payment.status !== status) return false
    if (recipient && payment.recipient !== recipient) return false
    if (repository && payment.repository !== repository) return false
    return true
  })

  return ctx.json({ payments })
})
