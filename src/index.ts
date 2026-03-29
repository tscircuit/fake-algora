import app from "./app";

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`🚀 fake-algora running on http://localhost:${PORT}`);
  console.log(`   GET  /health`);
  console.log(`   GET  /bounties`);
  console.log(`   POST /bounties`);
  console.log(`   GET  /bounties/:id`);
  console.log(`   GET  /payments`);
  console.log(`   GET  /payments/:id`);
  console.log(`   POST /payments/send`);
});
