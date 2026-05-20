import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const sendPaymentBodySchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).default("USD"),
  repository: z.string().min(1).optional(),
  issue_number: z.number().int().positive().optional(),
  bounty_id: z.string().min(1).optional(),
  idempotency_key: z.string().min(1).optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentBodySchema,
  jsonResponse: z.object({
    payment: paymentSchema,
    idempotent_replay: z.boolean(),
  }),
})(async (req, ctx) => {
  const body = await req.json()
  const idempotencyKey =
    req.headers.get("idempotency-key") ?? body.idempotency_key

  if (idempotencyKey) {
    const existingPayment = ctx.db.findPaymentByIdempotencyKey(idempotencyKey)
    if (existingPayment) {
      return ctx.json({
        payment: existingPayment,
        idempotent_replay: true,
      })
    }
  }

  const payment = ctx.db.addPayment({
    recipient: body.recipient,
    amount: body.amount,
    currency: (body.currency ?? "USD").toUpperCase(),
    repository: body.repository,
    issue_number: body.issue_number,
    bounty_id: body.bounty_id,
    idempotency_key: idempotencyKey ?? undefined,
  })

  return ctx.json({
    payment,
    idempotent_replay: false,
  })
})
