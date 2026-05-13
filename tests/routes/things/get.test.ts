import { getTestServer } from "tests/fixtures/get-test-server"
import { test, expect } from "bun:test"

test("get a thing by id", async () => {
  const { axios } = await getTestServer()

  await axios.post("/things/create", {
    name: "Thing1",
    description: "Thing1 Description",
  })

  const { data } = await axios.get("/things/get?thing_id=0")

  expect(data.thing).toEqual({
    thing_id: "0",
    name: "Thing1",
    description: "Thing1 Description",
  })
})

test("get a thing that doesn't exist returns 404", async () => {
  const { axios } = await getTestServer()

  try {
    await axios.get("/things/get?thing_id=999")
  } catch (e: any) {
    expect(e.status).toBe(404)
  }
})
