import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    recipient: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string().min(1).default("USD"),
    bounty_id: z.string().min(1).optional(),
    issue_number: z.number().int().positive().optional(),
    repository: z.string().min(1).optional(),
    idempotency_key: z.string().min(1).optional(),
  }),
  jsonResponse: z.object({
    payment: paymentSchema,
    reused: z.boolean(),
  }),
})(async (req, ctx) => {
  const body = await req.json()
  const existingPayment = body.idempotency_key
    ? ctx.db.payments.find(
        (payment) => payment.idempotency_key === body.idempotency_key,
      )
    : undefined

  const payment = ctx.db.sendPayment({
    ...body,
    currency: body.currency ?? "USD",
  })

  return ctx.json({
    payment,
    reused: Boolean(existingPayment),
  })
})
