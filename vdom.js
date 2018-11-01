const boundaryRegex = /[\.#\[]/

const processTag = (tag, attrs = {}) => {
  // 1. get clean tag
  let boundary = tag.match(boundaryRegex)
  // get rid of bad attrs
  if (typeof attrs !== 'object') {
    attrs = {}
  }
  // plain tag early exit
  if (!boundary) return [tag, attrs]
  const cleanTag = tag.slice(0, boundary.index)
  // 2. figure out props
  let props = tag.slice(boundary.index)
  attrs.class = ''
  let index = 0
  while (index < props.length) {
    let c = props[index]
    if (c === '.' || c === '#') {
      boundary = props.slice(index + 1).match(boundaryRegex)
      let newIndex = boundary ? index + boundary.index : props.length
      let id = props.slice(index + 1, newIndex + 1)
      index = newIndex
      if (c === '.') attrs.class += ' ' + id
      else attrs.id = id
    } else if (c === '[') {
      let newIndex = index + props.slice(index).indexOf(']')
      if (newIndex < index) throw Error('invalid selector: ' + tag)
      let [prop, val] = props.slice(index + 1, newIndex).split('=')
      index = newIndex
      if (prop) attrs[prop] = val || true
    }
    index += 1
  }
  return [cleanTag, attrs]
}

export const makeVdom = convert => {
  const handleChildren = (children = []) =>
    children
      .reduce((newChildren, child) => {
        if (!Array.isArray(child) || typeof child[0] === 'string') newChildren.push(process(child))
        else handleChildren(child).forEach(c => newChildren.push(c))
        return newChildren
      }, [])
      .filter(c => c != null)
  const process = node => {
    const type = typeof node
    if (node == null || type === 'undefined' || type === 'boolean') return null
    if (type === 'number') return convert(node + '')
    if (type === 'string') return convert(node)
    let [tag, attrs, ...children] = node
    if ((attrs || attrs === 0) && (typeof attrs !== 'object' || Array.isArray(attrs))) {
      children = [attrs, ...children]
      attrs = {}
    }
    // p('before', tag, attrs)
    ;[tag, attrs] = processTag(tag, attrs)
    // p('after', tag, attrs)
    return convert({
      tag,
      attrs,
      children: handleChildren(children)
    })
  }
  return process
}
