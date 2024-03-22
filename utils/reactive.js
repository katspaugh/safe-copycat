export function reactive(obj, render) {
  return new Proxy(obj, {
    set(target, key, value) {
      target[key] = value
      render()
      return true
    },
  })
}
