import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    payment_id: z.string(),
  }),
  jsonResponse: z.object({
    ok: z.boolean(),
  }),
})(async (req, ctx) => {
  const { payment_id } = await req.json()
  const success = ctx.db.completePayment(payment_id)
  return ctx.json({ ok: success })
})