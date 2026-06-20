export function on(root, type, selector, fn, options) {
  const el = resolveRoot(root)

  if (!el) throw new Error("esa.on(root, type, selector, fn) could not find root")
  if (typeof fn !== "function") throw new TypeError("esa.on(..., fn) requires a function")

  const listener = event => {
    const target = event.target?.closest?.(selector)
    if (!target || !el.contains(target)) return
    fn(target, event)
  }

  el.addEventListener(type, listener, options)

  return () => el.removeEventListener(type, listener, options)
}

function resolveRoot(root) {
  if (typeof root === "string") return document.querySelector(root)
  return root
}
