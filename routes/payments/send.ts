import { withRouteSpec } from "lib/middleware/with-winter-spec"
import {
  paymentRouteResponseSchema,
  sendPaymentRequestSchema,
  toAmountCents,
} from "lib/payments/schemas"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentRequestSchema,
  jsonResponse: paymentRouteResponseSchema,
})(async (req, ctx) => {
  const body = await req.json()
  const parsed = sendPaymentRequestSchema.safeParse(body)

  if (!parsed.success) {
    return ctx.json(
      { error: parsed.error.flatten() },
      {
        status: 400,
      },
    )
  }

  const payment = ctx.db.sendPayment({
    recipient_email: parsed.data.recipient_email,
    amount_cents: toAmountCents(parsed.data),
    currency: parsed.data.currency,
    bounty_issue_url: parsed.data.bounty_issue_url,
    note: parsed.data.note,
    idempotency_key: parsed.data.idempotency_key,
  })

  return ctx.json({ payment })
})
