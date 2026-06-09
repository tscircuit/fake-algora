import { withRouteSpec } from "lib/middleware/with-winter-spec"
  import { z } from "zod"
  import { randomUUID } from "crypto"

  export default withRouteSpec({
    methods: ["POST"],
    jsonBody: z.object({
      bounty_id: z.string(),
      recipient_username: z.string(),
      amount_usd: z.number().positive(),
    }),
    jsonResponse: z.object({
      payment: z.object({
        payment_id: z.string(),
        bounty_id: z.string(),
        recipient_username: z.string(),
        amount_usd: z.number(),
        paid_at: z.string(),
      }),
    }),
  })(async (req, ctx) => {
    const { bounty_id, recipient_username, amount_usd } = await req.json()
    const payment = {
      payment_id: randomUUID(),
      bounty_id,
      recipient_username,
      amount_usd,
      paid_at: new Date().toISOString(),
    }
    ctx.db.addPayment(payment)
    return ctx.json({ payment })
  })
  