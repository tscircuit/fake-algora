import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const sendPaymentRequestSchema = z
  .object({
    recipient: z.string().min(1),
    amount_cents: z.number().int().positive().optional(),
    amount: z.number().positive().optional(),
    currency: z
      .string()
      .length(3)
      .default("USD")
      .transform((currency) => currency.toUpperCase()),
    description: z.string().optional(),
    bounty_id: z.string().optional(),
    issue_number: z.number().int().positive().optional(),
    repository: z.string().optional(),
    idempotency_key: z.string().min(1).optional(),
  })
  .refine(
    (body) => body.amount_cents !== undefined || body.amount !== undefined,
    "amount_cents or amount is required",
  )

const sendPaymentResponseSchema = z.object({
  ok: z.boolean(),
  payment: paymentSchema,
  duplicate: z.boolean(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentRequestSchema,
  jsonResponse: sendPaymentResponseSchema,
})(async (req, ctx) => {
  const body = sendPaymentRequestSchema.parse(await req.json())

  if (body.idempotency_key) {
    const existingPayment = ctx.db.getPaymentByIdempotencyKey(
      body.idempotency_key,
    )

    if (existingPayment) {
      return ctx.json({ ok: true, payment: existingPayment, duplicate: true })
    }
  }

  const { amount, ...paymentInput } = body
  const payment = ctx.db.addPayment({
    ...paymentInput,
    amount_cents: paymentInput.amount_cents ?? Math.round(amount! * 100),
  })

  return ctx.json({ ok: true, payment, duplicate: false })
})
