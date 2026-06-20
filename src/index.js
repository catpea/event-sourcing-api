import { createEventFactory, eventObject } from "./event.js"
import { applyEvent, replayEvents } from "./replay.js"
import { createStore } from "./store.js"
import { list } from "./collections/list.js"
import { morph } from "./dom/reconcile.js"
import { render as renderDom } from "./dom/render.js"
import { on } from "./dom/on.js"
import { html } from "./dom/html.js"

export function createEsa() {
  const api = {
    plugins: [],

    use(plugin) {
      if (!plugin || typeof plugin !== "object") {
        throw new TypeError("esa.use(plugin) requires a plugin object")
      }

      api.plugins.push(plugin)
      plugin.install?.(api)
      return api
    },

    event(type, data = {}) {
      let event = eventObject(type, data)

      for (const plugin of api.plugins) {
        event = plugin.event?.(event, api) ?? event
      }

      return event
    },

    apply(model, event, options) {
      return applyEvent(api, model, event, options)
    },

    replay(Model, events, options) {
      return replayEvents(api, Model, events, options)
    },

    store(initialEvents, options) {
      return createStore(api, initialEvents, options)
    },

    render(target, Model, store, view, options) {
      return renderDom(api, target, Model, store, view, options)
    },

    on,
    html,
    morph,
    list,

    create() {
      return createEsa()
    }
  }

  api.E = createEventFactory(api.event)
  return api
}

export const esa = createEsa()
export const E = esa.E

export { list } from "./collections/list.js"
export { morph } from "./dom/reconcile.js"
export { renderDom as render }
export { on, html }
