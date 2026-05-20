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
  const repository = url.searchParams.get("repository")
  const statusParam = url.searchParams.get("status")
  const status = statusParam
    ? paymentStatusSchema.safeParse(statusParam)
    : undefined

  const payments = ctx.db.payments.filter((payment) => {
    if (recipient && payment.recipient !== recipient) return false
    if (repository && payment.repository !== repository) return false
    if (status && (!status.success || payment.status !== status.data)) {
      return false
    }
    return true
  })

  return ctx.json({ payments })
})
