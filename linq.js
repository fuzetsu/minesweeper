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

const groupBy = function*(transform) {
  const seen = new Set()
  const arr = this.toArray()
  yield* arr
    .select(transform)
    .where(key => key && !seen.has(key))
    .select(key => {
      seen.add(key)
      const iter = arr.where(i => key === transform(i))
      iter.key = key
      return iter
    })
}

const some = function(transform) {
  for (const item of this) {
    if (transform(item)) return true
  }
  return false
}

const every = function(transform) {
  for (const item of this) {
    if (!transform(item)) return false
  }
  return true
}

const count = function(transform = () => true) {
  let count = 0
  for (const item of this) {
    if (transform(item)) count += 1
  }
  return count
}

const find = function(transform) {
  for (const item of this) {
    if (transform(item)) return item
  }
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
;[where, select, groupBy, count].forEach(fn => (Array.prototype[fn.name] = fn))
;[where, select, groupBy, toArray, forEach, some, every, count, find].forEach(
  fn => (Generator.prototype[fn.name] = fn)
)
