import Dep from './dep'

function Observer(value) {
  this.value = value
  this.dep = new Dep()
  this.walk(value)
}

Observer.prototype.walk = function(obj) {
  const keys = Object.keys(obj)
  for (let i = 0, len = keys.length; i < len; i++) {
    this.convert(keys[i], obj[keys[i]])
  }
}

Observer.prototype.convert = function(key, val) {
  defineReactive(this.value, key, val)
}

Observer.prototype.addVm = function(vm) {
  (this.vms || (this.vms = [])).push(vm)
}

export function observe(value, vm) {
  const ob = new Observer(value)
  ob.addVm(vm)
  return ob
}

export function defineReactive(obj, key, val) {
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  const getter = property && property.get
  const setter = property && property.set

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
      }
      return value
    },
    set: function reactiveSetter(newVal) {
      const value = getter ? getter.call(obj) : val
      if (newVal === value) {
        return
      }
      val = newVal
      dep.notify()
    }
  })
}