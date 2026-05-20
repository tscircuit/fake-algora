import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentListRouteResponseSchema,
  paymentStatusSchema,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: paymentListRouteResponseSchema,
})((req, ctx) => {
  const url = new URL(req.url)
  const statusParam = url.searchParams.get("status")
  const parsedStatus =
    statusParam === null
      ? { success: true as const, data: null }
      : paymentStatusSchema.safeParse(statusParam)

  if (!parsedStatus.success) {
    return ctx.json(
      {
        error: {
          status: `Invalid payment status: ${statusParam}`,
          expected: paymentStatusSchema.options,
        },
      },
      { status: 400 },
    )
  }

  const payments = ctx.db.listPayments({
    recipient_email: url.searchParams.get("recipient_email"),
    status: parsedStatus.data,
  })

  return ctx.json({ payments })
})
