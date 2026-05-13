import { getTestServer } from "tests/fixtures/get-test-server"
import { test, expect } from "bun:test"

test("delete a thing", async () => {
  const { axios } = await getTestServer()

  await axios.post("/things/create", {
    name: "Thing1",
    description: "Thing1 Description",
  })

  const { data: listBefore } = await axios.get("/things/list")
  expect(listBefore.things).toHaveLength(1)

  await axios.post("/things/delete", {
    thing_id: "0",
  })

  const { data: listAfter } = await axios.get("/things/list")
  expect(listAfter.things).toHaveLength(0)
})

test("delete a non-existent thing does not error", async () => {
  const { axios } = await getTestServer()

  const res = await axios.post("/things/delete", {
    thing_id: "999",
  })

  expect(res.status).toBe(200)
  expect(res.data.ok).toBe(true)
})
