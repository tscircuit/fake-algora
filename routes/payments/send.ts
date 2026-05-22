import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    recipient: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string().min(1).optional(),
    bounty_id: z.string().optional(),
    issue_number: z.number().optional(),
    repository: z.string().optional(),
    idempotency_key: z.string().optional(),
  }),
  jsonResponse: z.object({
    payment: paymentSchema,
    idempotent_replay: z.boolean(),
  }),
})(async (req, ctx) => {
  const body = await req.json()
  const { payment, idempotentReplay } = ctx.db.createPayment({
    ...body,
    currency: body.currency || "USD",
  })

  return ctx.json({
    payment,
    idempotent_replay: idempotentReplay,
  })
})
