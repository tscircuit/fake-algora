import { paymentSchema, paymentStatusSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const listPaymentsQuerySchema = z.object({
  recipient: z.string().optional(),
  repository: z.string().optional(),
  issue_number: z.coerce.number().int().positive().optional(),
  status: paymentStatusSchema.optional(),
})

export default withRouteSpec({
  methods: ["GET"],
  queryParams: listPaymentsQuerySchema,
  jsonResponse: z.object({
    payments: z.array(paymentSchema),
  }),
})((req, ctx) => {
  return ctx.json({ payments: ctx.db.listPayments(req.query) })
})
