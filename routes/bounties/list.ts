import { withRouteSpec } from "lib/middleware/with-winter-spec"
  import { z } from "zod"

  export default withRouteSpec({
    methods: ["GET"],
    jsonResponse: z.object({
      bounties: z.array(z.object({
        bounty_id: z.string(),
        issue_url: z.string(),
        amount_usd: z.number(),
        status: z.string(),
        created_at: z.string(),
      })),
    }),
  })(async (req, ctx) => {
    return ctx.json({ bounties: ctx.db.getBounties() })
  })
  