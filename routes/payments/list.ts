import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: z.object({
    recipient: z.string().optional(),
    status: z.enum(["pending", "completed", "failed"]).optional(),
  }),
  jsonResponse: z.object({
    payments: z.array(paymentSchema),
  }),
})((req, ctx) => {
  const url = new URL(req.url)
  const recipient = url.searchParams.get("recipient") ?? undefined
  const status = (url.searchParams.get("status") ?? undefined) as
    | "pending"
    | "completed"
    | "failed"
    | undefined

  const payments = ctx.db.listPayments({ recipient, status })
  return ctx.json({ payments })
})