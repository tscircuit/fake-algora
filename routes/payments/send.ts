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
    bounty_issue: z.string().min(1).optional(),
    repository: z.string().min(1).optional(),
    idempotency_key: z.string().min(1).optional(),
  }),
  jsonResponse: z.object({
    payment: paymentSchema,
    idempotent_replay: z.boolean(),
  }),
})(async (req, ctx) => {
  const body = await req.json()
  const paymentBeforeCreate = body.idempotency_key
    ? ctx.db
        .listPayments()
        .find((payment) => payment.idempotency_key === body.idempotency_key)
    : undefined
  const payment = ctx.db.createPayment(body)

  return ctx
    .json({
      payment,
      idempotent_replay: Boolean(paymentBeforeCreate),
    })
    .status(paymentBeforeCreate ? 200 : 201)
})
