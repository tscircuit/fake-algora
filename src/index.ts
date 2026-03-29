import { createApp } from "./app"

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

const app = createApp()

app.listen(PORT, () => {
  console.log(`🚀 fake-algora server running on http://localhost:${PORT}`)
  console.log(`   Health: GET  /health`)
  console.log(`   Bounties: GET|POST /api/bounties`)
  console.log(`             GET      /api/bounties/:id`)
  console.log(`   Payments: POST     /api/payments`)
  console.log(`             GET      /api/payments`)
  console.log(`             GET      /api/payments/:id`)
})
