// copied and expanded from https://surfingthecode.com/linq-like-functions-in-javascript-with-deferred-execution/
const where = function*(isMatch) {
  for (const item of this) {
    if (isMatch(item)) {
      yield item
    }
  }
}

const select = function*(transform) {
  for (const item of this) {
    yield transform(item)
  }
}

const any = function(transform) {
  for (const item of this) {
    if (transform(item)) return true
  }
  return false
}

const all = function(transform) {
  for (const item of this) {
    if (!transform(item)) return false
  }
  return true
}

const count = function(transform) {
  let count = 0
  for (const item of this) {
    if (transform(item)) count += 1
  }
  return count
}

const first = function(transform, fallback) {
  for (const item of this) {
    if (transform(item)) return item
  }
  return fallback
}

const forEach = function(fn) {
  for (const item of this) {
    fn(item)
  }
}

const toArray = function() {
  return Array.from(this)
}

const Generator = Object.getPrototypeOf(function*() {})
;[where, select].forEach(fn => (Array.prototype[fn.name] = fn))
;[where, select, toArray, forEach, any, all, count, first].forEach(
  fn => (Generator.prototype[fn.name] = fn)
)
