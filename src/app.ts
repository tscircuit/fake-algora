import express from "express";
import bountiesRouter from "./routes/bounties";
import paymentsRouter from "./routes/payments";

const app = express();

app.use(express.json());

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "fake-algora" });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/bounties", bountiesRouter);
app.use("/payments", paymentsRouter);

// ---------------------------------------------------------------------------
// 404 fallthrough
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
