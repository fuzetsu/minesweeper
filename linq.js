// copied and expanded from https://surfingthecode.com/linq-like-functions-in-javascript-with-deferred-execution/
const whereGenerator = function*(isMatch) {
  for (const item of this) {
    if (isMatch(item)) {
      yield item
    }
  }
}

const selectGenerator = function*(transform) {
  for (const item of this) {
    yield transform(item)
  }
}

const anyFunction = function(transform) {
  for (const item of this) {
    if (transform(item)) return true
  }
  return false
}

const allFunction = function(transform) {
  for (const item of this) {
    if (!transform(item)) return false
  }
  return true
}

const countFunction = function(transform) {
  let count = 0
  for (const item of this) {
    if (transform(item)) count += 1
  }
  return count
}

const forEachFunction = function(fn) {
  for (const item of this) {
    fn(item)
  }
}

const toArrayFunction = function() {
  return Array.from(this)
}

// obtain generator prototype object
const Generator = Object.getPrototypeOf(function*() {})

// extend prototypes
Generator.prototype.where = whereGenerator
Array.prototype.where = whereGenerator

Generator.prototype.select = selectGenerator
Array.prototype.select = selectGenerator

Generator.prototype.toArray = toArrayFunction
Generator.prototype.forEach = forEachFunction
Generator.prototype.any = anyFunction
Generator.prototype.all = allFunction
Generator.prototype.count = countFunction
