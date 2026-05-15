import { it, expect } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

it("GET /health should return ok", async () => {
  const { ky } = await getTestServer()
  const data = await ky.get("health").json()
  expect(data).toEqual({ ok: true })
})
