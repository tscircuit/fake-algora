import {
  type PaymentStatus,
  paymentSchema,
  paymentStatusSchema,
} from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    payments: z.array(paymentSchema),
  }),
})((req, ctx) => {
  const params = new URL(req.url).searchParams
  const status = params.get("status")
  const repository = params.get("repository") ?? undefined

  const filters: { status?: PaymentStatus; repository?: string } = {
    repository,
  }

  if (status) {
    filters.status = paymentStatusSchema.parse(status)
  }

  return ctx.json({ payments: ctx.db.listPayments(filters) })
})
