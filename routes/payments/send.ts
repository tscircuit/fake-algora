import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { paymentResponseSchema } from "lib/payments/response-schemas"
import { z } from "zod"

const sendPaymentRequestSchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(3).default("USD"),
  bounty_id: z.string().optional(),
  issue_number: z.number().int().positive().optional(),
  repository: z.string().optional(),
  idempotency_key: z.string().optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentRequestSchema,
  jsonResponse: paymentResponseSchema,
})(async (req, ctx) => {
  const paymentInput = sendPaymentRequestSchema.parse(await req.json())
  const payment = ctx.db.sendPayment(paymentInput)

  return ctx.json({ payment })
})
