'use strict'

module.exports = {
  deepFreeze: deepFreeze,
  deepClone: deepClone,
  makeClonable: makeClonable,
  makeClonableAndDeepFreeze: makeClonableAndDeepFreeze
}

function deepFreeze (o) {
  Object.freeze(o)

  Object.getOwnPropertyNames(o)
    .map(n => o[n])
    .filter(_shouldFreeze)
    .forEach(deepFreeze)
}

function deepClone (o) {
  const newO = Object.assign({}, o)

  Object.getOwnPropertyNames(newO)
    .filter(p => _shouldClone(newO[p]))
    .forEach(p => { newO[p] = deepClone(newO[p]) })

  return newO
}

function makeClonable (obj) {
  obj.cloneAndRefreeze = (changesCallback) => {
    const clone = deepClone(obj)
    if (typeof changesCallback === 'function') changesCallback(clone)
    makeClonable(clone)
    deepFreeze(clone)
    return clone
  }
}

function makeClonableAndDeepFreeze (obj) {
  makeClonable(obj)
  deepFreeze(obj)
}

function _shouldFreeze (x) {
  if (x === null) return false
  if (typeof x !== 'object' && typeof x !== 'function') return false
  if (Object.isFrozen(x)) return false
  return true
}

function _shouldClone (x) {
  if (x === null) return false
  if (typeof x !== 'object') return false
  return true
}
