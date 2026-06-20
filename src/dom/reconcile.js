const ELEMENT_NODE = 1
const TEXT_NODE = 3
const COMMENT_NODE = 8
const DOCUMENT_FRAGMENT_NODE = 11

export function morph(fromNode, toNode, options = {}) {
  const target = toDomNode(toNode, fromNode.ownerDocument ?? document)
  const opts = normalizeOptions(options)

  if (opts.childrenOnly) {
    morphChildren(fromNode, target, opts)
    return fromNode
  }

  return morphNode(fromNode, target, opts)
}

function normalizeOptions(options) {
  return {
    childrenOnly: false,
    getNodeKey: defaultNodeKey,
    onBeforeNodeAdded: node => node,
    onNodeAdded: () => {},
    onBeforeNodeDiscarded: () => true,
    onNodeDiscarded: () => {},
    onBeforeElUpdated: () => true,
    onElUpdated: () => {},
    onBeforeElChildrenUpdated: () => true,
    ...options
  }
}

function toDomNode(value, doc) {
  if (typeof value === "string") {
    const template = doc.createElement("template")
    template.innerHTML = value.trim()

    if (template.content.childNodes.length === 1) {
      return template.content.firstChild
    }

    return template.content
  }

  return value
}

function morphNode(fromNode, toNode, opts) {
  if (!fromNode) return addNode(toNode, opts)

  if (!toNode) {
    discardNode(fromNode, opts)
    return null
  }

  if (fromNode.isEqualNode?.(toNode)) return fromNode

  if (!compatible(fromNode, toNode)) {
    const replacement = addNode(toNode, opts)
    fromNode.replaceWith(replacement)
    discardNode(fromNode, opts, { alreadyRemoved: true })
    return replacement
  }

  switch (fromNode.nodeType) {
    case ELEMENT_NODE:
      morphElement(fromNode, toNode, opts)
      return fromNode

    case TEXT_NODE:
    case COMMENT_NODE:
      if (fromNode.nodeValue !== toNode.nodeValue) {
        fromNode.nodeValue = toNode.nodeValue
      }
      return fromNode

    case DOCUMENT_FRAGMENT_NODE:
      morphChildren(fromNode, toNode, opts)
      return fromNode

    default:
      return fromNode
  }
}

function morphElement(fromEl, toEl, opts) {
  const before = opts.onBeforeElUpdated(fromEl, toEl)
  if (before === false) return fromEl

  if (before && before !== true && before.nodeType) {
    fromEl = before
  }

  syncAttributes(fromEl, toEl)
  syncFormState(fromEl, toEl)

  if (opts.onBeforeElChildrenUpdated(fromEl, toEl) !== false) {
    morphChildren(fromEl, toEl, opts)
  }

  opts.onElUpdated(fromEl)
  return fromEl
}

function morphChildren(fromParent, toParent, opts) {
  const keyed = new Map()

  for (const child of Array.from(fromParent.childNodes)) {
    const key = opts.getNodeKey(child)
    if (key != null) keyed.set(key, child)
  }

  const kept = new Set()

  for (const targetChild of Array.from(toParent.childNodes)) {
    const reference = firstUnkeptChild(fromParent, kept)
    const targetKey = opts.getNodeKey(targetChild)
    let matchingFrom = null

    if (targetKey != null) {
      const keyedFrom = keyed.get(targetKey)
      if (keyedFrom && !kept.has(keyedFrom) && compatible(keyedFrom, targetChild)) {
        matchingFrom = keyedFrom
      }
    }

    if (!matchingFrom && reference && compatible(reference, targetChild)) {
      matchingFrom = reference
    }

    if (matchingFrom) {
      morphNode(matchingFrom, targetChild, opts)

      if (matchingFrom !== reference) {
        fromParent.insertBefore(matchingFrom, reference)
      }

      kept.add(matchingFrom)
    } else {
      const added = addNode(targetChild, opts)
      fromParent.insertBefore(added, reference)
      kept.add(added)
    }
  }

  for (const child of Array.from(fromParent.childNodes)) {
    if (!kept.has(child)) discardNode(child, opts)
  }
}

function firstUnkeptChild(parent, kept) {
  for (const child of Array.from(parent.childNodes)) {
    if (!kept.has(child)) return child
  }

  return null
}

function addNode(node, opts) {
  const candidate = opts.onBeforeNodeAdded(node.cloneNode(true))
  if (candidate === false) return document.createTextNode("")

  const added = candidate?.nodeType ? candidate : node.cloneNode(true)
  opts.onNodeAdded(added)
  return added
}

function discardNode(node, opts, meta = {}) {
  if (opts.onBeforeNodeDiscarded(node) === false) return
  if (!meta.alreadyRemoved && node.parentNode) node.parentNode.removeChild(node)
  opts.onNodeDiscarded(node)
}

function compatible(a, b) {
  if (!a || !b) return false
  if (a.nodeType !== b.nodeType) return false

  if (a.nodeType === ELEMENT_NODE) {
    return a.nodeName === b.nodeName
  }

  return true
}

function syncAttributes(fromEl, toEl) {
  for (const attr of Array.from(fromEl.attributes ?? [])) {
    if (!toEl.hasAttribute(attr.name)) fromEl.removeAttribute(attr.name)
  }

  for (const attr of Array.from(toEl.attributes ?? [])) {
    if (fromEl.getAttribute(attr.name) !== attr.value) {
      fromEl.setAttribute(attr.name, attr.value)
    }
  }
}

function syncFormState(fromEl, toEl) {
  const name = fromEl.nodeName

  if (name === "INPUT" || name === "TEXTAREA") {
    if (fromEl.value !== toEl.value) fromEl.value = toEl.value
    fromEl.defaultValue = toEl.defaultValue
  }

  if (name === "INPUT") {
    fromEl.checked = toEl.checked
    fromEl.defaultChecked = toEl.defaultChecked
  }

  if (name === "OPTION") {
    fromEl.selected = toEl.selected
  }
}

function defaultNodeKey(node) {
  if (node.nodeType !== ELEMENT_NODE) return null

  return (
    node.getAttribute("data-key") ??
    node.getAttribute("key") ??
    node.id ??
    null
  )
}
