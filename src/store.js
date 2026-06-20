export function createStore(api, initialEvents = [], options = {}) {
  let events = Array.from(initialEvents)
  let cursor = normalizeCursor(options.cursor ?? events.length, events.length)
  const listeners = new Set()

  const store = {
    append(...nextEvents) {
      if (nextEvents.length === 1 && Array.isArray(nextEvents[0])) {
        nextEvents = nextEvents[0]
      }

      if (nextEvents.length === 0) return []

      // Branch reality after undo. The hidden future is discarded because a new fact happened.
      if (cursor < events.length) {
        events = events.slice(0, cursor)
      }

      const accepted = []

      for (let event of nextEvents) {
        for (const plugin of api.plugins) {
          event = plugin.beforeAppend?.(event, store, api) ?? event
        }

        events.push(event)
        cursor = events.length
        accepted.push(event)

        for (const plugin of api.plugins) {
          plugin.afterAppend?.(event, store, api)
        }
      }

      emit({ type: "append", events: accepted, store })
      return accepted.length === 1 ? accepted[0] : accepted
    },

    all() {
      return events.slice(0, cursor)
    },

    visible() {
      return events.slice(0, cursor)
    },

    log() {
      return events.slice()
    },

    cursor() {
      return cursor
    },

    size() {
      return cursor
    },

    historySize() {
      return events.length
    },

    canUndo() {
      return cursor > 0
    },

    canRedo() {
      return cursor < events.length
    },

    undo(n = 1) {
      const next = normalizeCursor(cursor - n, events.length)
      if (next !== cursor) {
        cursor = next
        emit({ type: "undo", cursor, store })
      }
      return store
    },

    redo(n = 1) {
      const next = normalizeCursor(cursor + n, events.length)
      if (next !== cursor) {
        cursor = next
        emit({ type: "redo", cursor, store })
      }
      return store
    },

    seek(nextCursor) {
      const next = normalizeCursor(nextCursor, events.length)
      if (next !== cursor) {
        cursor = next
        emit({ type: "seek", cursor, store })
      }
      return store
    },

    reset(nextEvents = []) {
      events = Array.from(nextEvents)
      cursor = events.length
      emit({ type: "reset", store })
      return store
    },

    clear() {
      events = []
      cursor = 0
      emit({ type: "clear", store })
      return store
    },

    subscribe(fn) {
      if (typeof fn !== "function") {
        throw new TypeError("store.subscribe(fn) requires a function")
      }

      listeners.add(fn)
      return () => listeners.delete(fn)
    }
  }

  return store

  function emit(change) {
    for (const listener of Array.from(listeners)) {
      listener(change)
    }
  }
}

function normalizeCursor(value, max) {
  const number = Number.isFinite(value) ? Math.trunc(value) : max
  return Math.max(0, Math.min(max, number))
}
