import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const paymentBodySchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).default("USD"),
  owner: z.string().min(1).optional(),
  repo: z.string().min(1).optional(),
  bounty_id: z.string().min(1).optional(),
  issue_number: z.number().int().positive().optional(),
  repository: z.string().min(1).optional(),
  idempotency_key: z.string().min(1).optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema,
    idempotent: z.boolean(),
  }),
})(async (req, ctx) => {
  const body = paymentBodySchema.parse(await req.json())
  const existingPayment = body.idempotency_key
    ? ctx.db.payments.find(
        (payment) => payment.idempotency_key === body.idempotency_key,
      )
    : undefined
  const payment = ctx.db.sendPayment(body)

  return ctx.json({ payment, idempotent: Boolean(existingPayment) })
})
