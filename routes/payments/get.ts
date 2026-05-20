import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const responseSchema = z.union([
  z.object({
    ok: z.literal(true),
    payment: paymentSchema,
  }),
  z.object({
    ok: z.literal(false),
    error: z.literal("payment_not_found"),
  }),
])

const jsonResponse = (body: z.infer<typeof responseSchema>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  })

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: responseSchema,
})((req, ctx) => {
  const paymentId = new URL(req.url).searchParams.get("payment_id")
  const payment = paymentId ? ctx.db.getPayment(paymentId) : undefined

  if (!payment) {
    return jsonResponse({ ok: false, error: "payment_not_found" }, 404)
  }

  return jsonResponse({ ok: true, payment })
})
