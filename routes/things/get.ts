import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  queryParams: z.object({
    thing_id: z.string(),
  }),
  jsonResponse: z.object({
    thing: z.object({
      thing_id: z.string(),
      name: z.string(),
      description: z.string(),
    }),
  }),
})((req, ctx) => {
  const { thing_id } = req.query
  const thing = ctx.db.things.find((t) => t.thing_id === thing_id)

  if (!thing) {
    return ctx.json({ error: "Thing not found" }, { status: 404 })
  }

  return ctx.json({ thing })
})
