const RESERVED_PROXY_KEYS = new Set([
  "then",
  "inspect",
  "toJSON",
  "valueOf",
  "toString"
])

export function createEventFactory(createEvent) {
  return new Proxy(Object.create(null), {
    get(_target, type) {
      if (typeof type === "symbol") return undefined
      if (RESERVED_PROXY_KEYS.has(type)) return undefined

      return (data = {}) => createEvent(type, data)
    },

    has() {
      return true
    }
  })
}

export function eventObject(type, data = {}) {
  if (typeof type !== "string" || type.length === 0) {
    throw new TypeError("event type must be a non-empty string")
  }

  if (data == null) return { type }

  if (isPlainObject(data)) {
    return { type, ...data }
  }

  return { type, value: data }
}

function isPlainObject(value) {
  if (typeof value !== "object" || value === null) return false

  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}
