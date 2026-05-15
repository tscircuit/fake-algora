import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"
import { paymentResponseSchema } from "./schema"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    recipient_github_username: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string().min(3).default("USD"),
    bounty_issue_url: z.string().url().optional(),
    idempotency_key: z.string().min(1).optional(),
  }),
  jsonResponse: paymentResponseSchema,
})(async (req, ctx) => {
  const body = await req.json()
  const payment = ctx.db.addPayment({
    ...body,
    currency: body.currency ?? "USD",
  })

  return ctx.json({ payment })
})
