import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const listPaymentsQuerySchema = z.object({
  recipient: z.string().optional(),
  status: paymentStatusSchema.optional(),
})

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    payments: z.array(paymentSchema),
  }),
})((req, ctx) => {
  const url = new URL(req.url)
  const query = listPaymentsQuerySchema.parse({
    recipient: url.searchParams.get("recipient") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  })

  return ctx.json({ payments: ctx.db.listPayments(query) })
})
