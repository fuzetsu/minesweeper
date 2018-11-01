import { patch } from 'https://unpkg.com/superfine?module'
import 'https://unpkg.com/mithril/stream/stream.js'
import O from 'https://unpkg.com/patchinko/immutable.mjs'

import { makeVdom } from './vdom.js'

const makeWiredVdom = wireAction =>
  makeVdom(
    node =>
      typeof node === 'string'
        ? { name: node, props: {}, type: 2, children: [] }
        : {
            name: node.tag,
            props: processAttrs(node.attrs, wireAction),
            children: node.children || []
          }
  )

const makeActionWirer = (update, states, cache = new WeakMap()) => act => {
  let wired = cache.get(act)
  if (!wired) {
    wired = (...args) => {
      const res = act(states(), ...args)
      if (typeof res === 'object') update(res)
    }
    cache.set(act, wired)
  }
  return wired
}

const processAttrs = (attrs, wireAction) => {
  if (!attrs) return {}
  Object.entries(attrs).forEach(([prop, val]) => {
    if (prop.startsWith('on')) attrs[prop] = wireAction(val)
  })
  return attrs
}

const makeRenderer = (view, container, vdom) => {
  let node,
    pending = false,
    nextState = null
  return state => {
    nextState = state
    if (pending) return
    pending = true
    requestAnimationFrame(() => {
      pending = false
      node = patch(node, vdom(view(nextState)), container)
    })
  }
}

export const mount = ({ init, view, container, onupdate }) => {
  const update = m.stream()
  const models = m.stream.scan(
    (model, patch) => {
      patch = typeof patch === 'function' ? patch(model) : patch
      return patch ? O(model, patch) : model
    },
    init,
    update
  )
  const states = onupdate
    ? models.map(model => {
        const extra = onupdate(model)
        return extra ? O(model, extra) : model
      })
    : models
  const vdom = makeWiredVdom(makeActionWirer(update, states))
  const render = makeRenderer(view, container, vdom)
  let lastState = null
  states.map(state => state !== lastState && render((lastState = state)))
  return update
}
