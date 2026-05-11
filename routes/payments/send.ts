import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const sendPaymentBodySchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).default("USD"),
  owner: z.string().optional(),
  repo: z.string().optional(),
  issue_number: z.number().int().positive().optional(),
  bounty_id: z.string().optional(),
  idempotency_key: z.string().optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema,
    idempotent: z.boolean(),
  }),
})(async (req, ctx) => {
  const body = await req.json()
  const existingPayment = body.idempotency_key
    ? ctx.db.payments.find(
        (payment) => payment.idempotency_key === body.idempotency_key,
      )
    : undefined

  const payment = ctx.db.createPayment({
    ...body,
    currency: body.currency ?? "USD",
  })

  return ctx.json({
    payment,
    idempotent: Boolean(existingPayment),
  })
})
