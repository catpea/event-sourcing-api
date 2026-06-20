export function html(strings, ...values) {
  if (!Array.isArray(strings) || !Object.prototype.hasOwnProperty.call(strings, "raw")) {
    return String(strings ?? "")
  }

  let output = ""

  for (let i = 0; i < strings.length; i++) {
    output += strings[i]
    if (i < values.length) output += renderValue(values[i])
  }

  return output
}

function renderValue(value) {
  if (Array.isArray(value)) return value.map(renderValue).join("")
  if (value == null || value === false) return ""
  return String(value)
}
