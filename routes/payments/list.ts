import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const listPaymentsResponseSchema = z.object({
  payments: z.array(paymentSchema),
})

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: listPaymentsResponseSchema,
})((req, ctx) => {
  const url = new URL(req.url)
  const recipient = url.searchParams.get("recipient") ?? undefined
  const status = url.searchParams.get("status") ?? undefined

  const statusResult = status
    ? paymentStatusSchema.safeParse(status)
    : undefined
  const payments = ctx.db.payments.filter((payment) => {
    if (recipient && payment.recipient !== recipient) return false
    if (statusResult?.success && payment.status !== statusResult.data)
      return false
    return true
  })

  return ctx.json({ payments })
})
