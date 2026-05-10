import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    recipient: z.string().min(1),
    amount_usd: z.number().positive(),
    currency: z.string().optional(),
    bounty_id: z.string().optional(),
    issue_url: z.string().url().optional(),
    memo: z.string().optional(),
    idempotency_key: z.string().min(1).optional(),
  }),
  jsonResponse: z.object({
    payment: paymentSchema,
    replayed: z.boolean(),
  }),
})(async (req, ctx) => {
  const body = await req.json()
  const result = ctx.db.sendPayment({
    recipient: body.recipient,
    amount_usd: body.amount_usd,
    currency: body.currency ?? "USD",
    bounty_id: body.bounty_id,
    issue_url: body.issue_url,
    memo: body.memo,
    idempotency_key: body.idempotency_key,
  })

  return ctx.json(result)
})
