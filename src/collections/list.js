export function list(key = "id", initialItems = []) {
  const items = []
  const keyOf = typeof key === "function" ? key : item => item?.[key]

  const api = {
    add(item) {
      const itemKey = keyOf(item)
      const index = items.findIndex(existing => keyOf(existing) === itemKey)

      if (index === -1) items.push(item)
      else items[index] = item

      return item
    },

    push(item) {
      return api.add(item)
    },

    get(id) {
      return items.find(item => keyOf(item) === id)
    },

    find(idOrPredicate) {
      if (typeof idOrPredicate === "function") return items.find(idOrPredicate)
      return api.get(idOrPredicate)
    },

    has(id) {
      return api.get(id) !== undefined
    },

    patch(id, changes) {
      const item = api.get(id)
      if (!item) return undefined

      const patch = typeof changes === "function" ? changes(item) : changes
      Object.assign(item, patch)
      return item
    },

    remove(id) {
      const index = items.findIndex(item => keyOf(item) === id)
      if (index === -1) return undefined

      const [removed] = items.splice(index, 1)
      return removed
    },

    map(fn) {
      return items.map(fn)
    },

    filter(fn) {
      return items.filter(fn)
    },

    forEach(fn) {
      items.forEach(fn)
      return api
    },

    toArray() {
      return items.slice()
    },

    get length() {
      return items.length
    },

    [Symbol.iterator]() {
      return items[Symbol.iterator]()
    }
  }

  for (const item of initialItems) api.add(item)

  return api
}
