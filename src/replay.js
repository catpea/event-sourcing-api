export function applyEvent(api, model, event, options = {}) {
  if (!event || typeof event.type !== "string") {
    throw new TypeError("esa.apply(model, event) requires an event with a string .type")
  }

  for (const plugin of api.plugins) {
    plugin.beforeApply?.(model, event, options, api)
  }

  const handler = model?.[event.type] ?? model?.apply

  if (typeof handler === "function") {
    handler.call(model, event, options, api)
  } else if (options.strict) {
    throw new Error(`No handler for event type ${event.type}`)
  }

  for (const plugin of api.plugins) {
    plugin.afterApply?.(model, event, options, api)
  }

  return model
}

export function replayEvents(api, Model, events = [], options = {}) {
  const model = createModel(Model, options)

  for (const event of events) {
    applyEvent(api, model, event, options)
  }

  return model
}

function createModel(Model, options) {
  if (typeof Model === "function") return new Model(options)

  if (Model && typeof Model === "object") {
    return options.clone === false ? Model : cloneShallow(Model)
  }

  throw new TypeError("esa.replay(Model, events) requires a class/function or object model")
}

function cloneShallow(value) {
  const proto = Object.getPrototypeOf(value)
  return Object.assign(Object.create(proto), value)
}
