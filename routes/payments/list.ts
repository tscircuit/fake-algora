import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { paymentSchema } from "lib/db/schema"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    payments: z.array(paymentSchema),
  }),
})((req, ctx) => {
  return ctx.json({ payments: ctx.db.payments })
})
