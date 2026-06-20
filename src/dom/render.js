import { morph } from "./reconcile.js"

export function render(api, target, Model, store, view, options = {}) {
  const root = resolveRoot(target)

  if (!root) throw new Error("esa.render(target, Model, store, view) could not find target")
  if (!store || typeof store.all !== "function" || typeof store.subscribe !== "function") {
    throw new TypeError("esa.render(..., store, ...) requires an ESA store")
  }
  if (typeof view !== "function") throw new TypeError("esa.render(..., view) requires a function")

  const mode = options.childrenOnly ?? true

  const paint = change => {
    const model = api.replay(Model, store.all(), options.replay)
    const html = view(model, store, change)

    morph(root, html, {
      childrenOnly: mode,
      getNodeKey: options.getNodeKey ?? defaultRenderKey,
      onBeforeElUpdated(fromEl, toEl) {
        if (fromEl.isEqualNode?.(toEl)) return false
        return options.onBeforeElUpdated?.(fromEl, toEl) ?? true
      },
      ...options.morph
    })

    return model
  }

  const current = paint({ type: "initial", store })
  const unsubscribe = store.subscribe(paint)

  return {
    root,
    current,
    stop: unsubscribe,
    repaint: () => paint({ type: "manual", store })
  }
}

function resolveRoot(target) {
  if (typeof target === "string") return document.querySelector(target)
  return target
}

function defaultRenderKey(node) {
  if (node.nodeType !== 1) return null

  return (
    node.getAttribute("data-key") ??
    node.getAttribute("key") ??
    node.id ??
    null
  )
}
