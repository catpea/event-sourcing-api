export function metadata(options = {}) {
  const {
    ids = true,
    timestamps = true,
    now = () => new Date().toISOString(),
    id = () => crypto.randomUUID?.() ?? randomId(),
    actor,
    session,
    extra
  } = options

  return {
    name: "metadata",

    event(event) {
      const meta = { ...(event.meta ?? event.metadata ?? {}) }

      if (ids && meta.id == null) meta.id = id(event)
      if (timestamps && meta.at == null) meta.at = now(event)
      if (actor != null && meta.actor == null) meta.actor = value(actor, event)
      if (session != null && meta.session == null) meta.session = value(session, event)

      const more = typeof extra === "function" ? extra(event) : extra
      if (more && typeof more === "object") Object.assign(meta, more)

      return { ...event, meta }
    }
  }
}

function value(candidate, event) {
  return typeof candidate === "function" ? candidate(event) : candidate
}

function randomId() {
  return `evt_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}
