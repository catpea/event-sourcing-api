# event-sourcing-api

A tiny dependency-free JavaScript event sourcing API for replayable state, undo/redo, and DOM reconciliation.

```js
import { esa, E } from "event-sourcing-api"
```

The rule: events are plain objects, state is replay, UI is HTML, DOM is reconciled, history is a cursor, validation is optional.

## Tiny core

```js
import { esa, E } from "event-sourcing-api"

class BankAccount {
  balance = 0

  MoneyDeposited(e) {
    this.balance += e.amount
  }

  MoneyWithdrawn(e) {
    this.balance -= e.amount
  }
}

const events = [
  E.MoneyDeposited({ amount: 100 }),
  E.MoneyWithdrawn({ amount: 40 })
]

const account = esa.replay(BankAccount, events)

console.log(account.balance) // 60
```

No reducer required. Event names dispatch directly to aggregate methods.

## Store with undo / redo

Undo/redo is cursor-based. The full log remains available through `store.log()`, while `store.all()` returns the currently visible timeline.

```js
const store = esa.store()

store.append(E.Incremented())
store.append(E.Incremented())
store.undo()

console.log(store.all().length) // 1
console.log(store.log().length) // 2

store.redo()
```

Appending after undo forks reality by discarding the hidden future:

```js
store.undo()
store.append(E.Decremented())
```

## DOM rendering

`esa.render` replays the visible event timeline, calls your view, then reconciles the real DOM to the returned HTML.

The built-in reconciler is inspired by morphdom's real-DOM approach, but it is ESA-native and dependency-free. Use `data-key` for stable list identity.

```js
const screen = esa.render("#app", TodoList, store, todos => `
  <main>
    <h1>Todos</h1>
    <ul>
      ${todos.items.map(todo => `
        <li data-key="${todo.id}">
          ${todo.done ? "✓" : ""}
          ${todo.text}
          <button data-complete="${todo.id}">Done</button>
        </li>
      `).join("")}
    </ul>
  </main>
`)
```

By default, `esa.render` patches the children of the target element. This lets `#app` remain the mounting point.

## Delegated DOM events

Render freely. Bind once.

```js
esa.on("#app", "click", "[data-complete]", button => {
  store.append(E.TodoCompleted({ id: button.dataset.complete }))
})
```

## Optional collections

Plain arrays are recommended first. When repeated list operations become annoying, use the tiny optional helper:

```js
import { list } from "event-sourcing-api/collections"

class TodoList {
  items = list("id")

  TodoAdded(e) {
    this.items.add({ id: e.id, text: e.text, done: false })
  }

  TodoCompleted(e) {
    this.items.patch(e.id, { done: true })
  }
}
```

## Optional validation

Validation is a plugin, not the engine.

```js
import { validators } from "event-sourcing-api/validators"

esa.use(validators({
  MoneyDeposited(e) {
    if (typeof e.amount !== "number") throw new Error("amount must be a number")
  }
}))
```

## Package shape

```txt
event-sourcing-api
  E                    event factory
  esa.event            create an event by type
  esa.apply            apply one event to a model
  esa.replay           replay events into a model
  esa.store            event log with cursor undo/redo
  esa.render           replay + view + DOM reconciliation
  esa.on               delegated DOM events
  esa.morph            low-level DOM reconciler
  esa.list             tiny collection helper
```

Submodule imports:

```js
import { morph, html, on } from "event-sourcing-api/dom"
import { list } from "event-sourcing-api/collections"
import { validators } from "event-sourcing-api/validators"
import { metadata } from "event-sourcing-api/metadata"
```

## Design stance

- Modern ESM JavaScript.
- No TypeScript requirement.
- No runtime dependencies.
- No mandatory schemas.
- No aggregate base class.
- No command bus by default.
- No virtual DOM.
- No framework ownership of the UI.

