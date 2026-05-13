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
  const recipient = searchParams.get("recipient")
  const repository = searchParams.get("repository")
  const statusResult = paymentStatusSchema.safeParse(searchParams.get("status"))
  const status = statusResult.success ? statusResult.data : undefined

  const payments = ctx.db.payments.filter((payment) => {
    if (recipient && payment.recipient !== recipient) return false
    if (repository && payment.repository !== repository) return false
    if (status && payment.status !== status) return false
    return true
  })

  return ctx.json({ payments })
})
