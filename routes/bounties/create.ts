import { withRouteSpec } from "lib/middleware/with-winter-spec"
  import { z } from "zod"
  import { randomUUID } from "crypto"

  export default withRouteSpec({
    methods: ["POST"],
    jsonBody: z.object({
      issue_url: z.string().url(),
      amount_usd: z.number().positive(),
    }),
    jsonResponse: z.object({
      bounty: z.object({
        bounty_id: z.string(),
        issue_url: z.string(),
        amount_usd: z.number(),
        status: z.string(),
        created_at: z.string(),
      }),
    }),
  })(async (req, ctx) => {
    const { issue_url, amount_usd } = await req.json()
    const bounty = {
      bounty_id: randomUUID(),
      issue_url,
      amount_usd,
      status: "open" as const,
      created_at: new Date().toISOString(),
    }
    ctx.db.addBounty(bounty)
    return ctx.json({ bounty })
  })
  