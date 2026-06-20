export function validators(rules = {}) {
  return {
    name: "validators",

    event(event) {
      validate(event, rules[event.type])
      return event
    },

    beforeAppend(event) {
      validate(event, rules[event.type])
      return event
    }
  }
}

function validate(event, rule) {
  if (!rule) return

  if (typeof rule === "function") {
    const result = rule(event)
    if (result === false) throw new Error(`Invalid event ${event.type}`)
    return
  }

  if (typeof rule.safeParse === "function") {
    const result = rule.safeParse(event)
    if (!result.success) throw new Error(`Invalid event ${event.type}`)
    return
  }

  if (typeof rule.parse === "function") {
    rule.parse(event)
    return
  }

  throw new TypeError(`Validator for ${event.type} must be a function or schema-like object`)
}
