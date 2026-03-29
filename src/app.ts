import express from "express"
import { bountiesRouter } from "./routes/bounties"
import { paymentsRouter } from "./routes/payments"
import { errorHandler, notFound } from "./middleware/errorHandler"

export function createApp(): express.Application {
  const app = express()

  // ─── Global middleware ──────────────────────────────────────────────────────
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // ─── Health check ───────────────────────────────────────────────────────────
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "fake-algora" })
  })

  // ─── API routes ─────────────────────────────────────────────────────────────
  app.use("/api/bounties", bountiesRouter)
  app.use("/api/payments", paymentsRouter)

  // ─── Error handling ─────────────────────────────────────────────────────────
  app.use(notFound)
  app.use(errorHandler)

  return app
}
