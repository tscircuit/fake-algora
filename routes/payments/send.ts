import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const paymentBodySchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).default("USD"),
  bounty_id: z.string().optional(),
  issue_number: z.number().optional(),
  repository: z.string().optional(),
  idempotency_key: z.string().optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema,
  }),
})(async (req, ctx) => {
  const body = paymentBodySchema.parse(await req.json())

  if (body.idempotency_key) {
    const existingPayment = ctx.db.payments.find(
      (payment) => payment.idempotency_key === body.idempotency_key,
    )
    if (existingPayment) return ctx.json({ payment: existingPayment })
  }

  const payment = ctx.db.createPayment(body)
  return ctx.json({ payment })
})
