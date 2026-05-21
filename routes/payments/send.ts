import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    recipient: z.string().min(1),
    amount_cents: z.number().int().positive(),
    currency: z.string().min(3).max(8).optional(),
    idempotency_key: z.string().min(1).optional(),
    bounty_issue: z.string().min(1).optional(),
    memo: z.string().min(1).optional(),
  }),
  jsonResponse: z.object({
    payment: paymentSchema,
    idempotent_replay: z.boolean(),
  }),
})(async (req, ctx) => {
  const body = await req.json()
  const idempotency_key =
    body.idempotency_key ?? req.headers.get("idempotency-key") ?? undefined

  if (idempotency_key) {
    const existingPayment = ctx.db.getPaymentByIdempotencyKey(idempotency_key)

    if (existingPayment) {
      return ctx.json({
        payment: existingPayment,
        idempotent_replay: true,
      })
    }
  }

  const payment = ctx.db.addPayment({
    recipient: body.recipient,
    amount_cents: body.amount_cents,
    currency: body.currency ?? "USD",
    status: "pending",
    idempotency_key,
    bounty_issue: body.bounty_issue,
    memo: body.memo,
  })

  return ctx.json({
    payment,
    idempotent_replay: false,
  })
})
