import test from "node:test"
import assert from "node:assert/strict"
import { createEsa, esa, E } from "../src/index.js"
import { list } from "../src/collections/index.js"
import { validators } from "../src/plugins/validators.js"

class Counter {
  count = 0

  Incremented() {
    this.count += 1
  }

  Decremented() {
    this.count -= 1
  }
}

test("E creates plain event objects", () => {
  assert.deepEqual(E.MoneyDeposited({ amount: 10 }), {
    type: "MoneyDeposited",
    amount: 10
  })

  assert.deepEqual(E.Ping(), { type: "Ping" })
})

test("esa.replay dispatches by event type to model methods", () => {
  const counter = esa.replay(Counter, [
    E.Incremented(),
    E.Incremented(),
    E.Decremented()
  ])

  assert.equal(counter.count, 1)
})

test("store undo and redo move the visible cursor without deleting the log", () => {
  const store = esa.store()

  store.append(E.Incremented())
  store.append(E.Incremented())

  assert.equal(store.cursor(), 2)
  assert.equal(store.all().length, 2)

  store.undo()

  assert.equal(store.cursor(), 1)
  assert.equal(store.all().length, 1)
  assert.equal(store.log().length, 2)
  assert.equal(store.canRedo(), true)

  store.redo()

  assert.equal(store.cursor(), 2)
  assert.equal(store.all().length, 2)
})

test("appending after undo forks reality", () => {
  const store = esa.store([
    E.Incremented(),
    E.Incremented(),
    E.Incremented()
  ])

  store.undo(2)
  store.append(E.Decremented())

  assert.equal(store.cursor(), 2)
  assert.equal(store.log().length, 2)
  assert.deepEqual(store.log().map(e => e.type), ["Incremented", "Decremented"])
})

test("plugins can validate events as an opt-in concern", () => {
  const app = createEsa().use(validators({
    MoneyDeposited(e) {
      if (typeof e.amount !== "number") throw new Error("amount must be a number")
    }
  }))

  assert.deepEqual(app.event("MoneyDeposited", { amount: 1 }), {
    type: "MoneyDeposited",
    amount: 1
  })

  assert.throws(
    () => app.event("MoneyDeposited", { amount: "one" }),
    /amount must be a number/
  )
})

test("list helper handles add, patch, remove", () => {
  const items = list("id")

  items.add({ id: "a", text: "Alpha", done: false })
  items.patch("a", { done: true })

  assert.equal(items.get("a").done, true)
  assert.equal(items.length, 1)

  items.remove("a")

  assert.equal(items.length, 0)
})
