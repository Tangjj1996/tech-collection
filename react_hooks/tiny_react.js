let rootInstance = null
let wipInstance = null
let wipHookIndex = 0

function createElement(type, props, ...children) {
  return {
    type,
    props,
    children: children.map(child => (
      typeof child === 'object' ? child : createTextElement(child)
    ))
  }
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text
    }
  }
}

const TinyReact = {
  createElement,
  render,
  useState,
  useCallback,
  useMemo,
  useRef
}

function render(element, container) {
  const prevInstance = rootInstance
  const nextInstance = recocile(container, prevInstance, element)
  rootInstance = nextInstance
}

function recocile(parentDom, instance, element) {
  if (instance === null) {
    // Create instance
    const newInstance = instantiate(element)
    parentDom.appendChild(newInstance.dom)
    return newInstance
  } else if (element === null) {
    // Remove instance
    parentDom.removeChild(instance.dom)
    return null
  } else if(instance.element.type !== element.type) {
    // Replace instance
    const newInstance = instantiate(element)
    parentDom.replaceChild(newInstance.dom, instance.dom)
    return newInstance
  } else if (typeof element.type === 'string') {
    // Update dom instance
    updateDomProperties(instance.dom, instance.element.props)
    instance.childInstances = recocileChildren(instance, element)
    instance.element = element
    return instance
  } else {
    // Update function instance
    wipInstance = instance
    wipHookIndex = 0
    const childElement = element.type(element.props)
    const oldChildInstance = instance.childInstance
    const childInstance = recocile(parentDom, oldChildInstance, childElement)
    instance.dom = childInstance.dom
    instance.element = element
    instance.childInstance = childInstance
    return instance
  }
}

function recocileChildren(instance, element) {
  const { dom, childInstances } = instance
  const { children = [] } = element
  const newChildInstances = []
  const count = Math.max(childInstances.length, children.length)
  for (let i = 0; i < count; i++) {
    const childInstance = childInstances[i]
    const childElement = children[i]
    const newChildInstance = recocile(dom, childInstance, childElement)
    newChildInstances.push(newChildInstance)
  }
  return newChildInstances.filter((instance) => instance !== null)
}

function instantiate(element) {
  const { type, props, children = [] } = element
  // Handle function component
  if (typeof type === 'function') {
    wipInstance = { hooks: [] }
    wipHookIndex = 0
    const childElement = type(props)
    const childInstance = instantiate(childElement)
    wipInstance.dom = childInstance.dom
    wipInstance.element = element
    wipInstance.childInstance = childInstance
    return wipInstance
  }
  // Create DOM element
  const isTextElement = type === "TEXT_ELEMENT"
  const dom = isTextElement ? document.createTextNode("") : document.createElement(type)
  updateDomProperties(dom, [], props)
  // Instantiate and append children
  const childInstances = children.map(instantiate)
  const childDoms = childInstances.map(childInstance => childInstance.dom)
  childDoms.forEach(childDom => dom.appendChild(childDom))

  return { dom, element, childInstances }
}

function updateDomProperties(dom, prevProps, nextProps) {
  const isEvent = (name) => name.startsWith('on')
  const isAttribute = (name) => !isEvent(name)

  // Remove event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeChildEventListener(eventType, prevProps[name])
    })

  // Remove attribute
  Object.keys(prevProps)
    .filter(isAttribute)
    .forEach(name => {
      dom[name] = null
    })
  
  // Set attributes
  Object.keys(nextProps)
    .filter(isAttribute)
    .forEach(name => {
      dom[name] = nextProps[name]
    })
  
  // Add event listeners
  Object.keys(nextProps)
    .forEach(isEvent)
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })
}

function useState(initialVaule) {
  const instance = wipInstance
  const hooks = wipInstance.hooks
  const hookIndex = wipHookIndex
  hooks[hookIndex] = hooks[hookIndex] || initialVaule
  const setState = (newState) => {
    hooks[hookIndex] = newState
    recocile(instance.dom.parentDom, instance, instance.element)
  }
  return [wipInstance.hooks[wipHookIndex++], setState]
}

function useEffect(callback, deps) {
  const oldDeps = wipInstance.hooks[wipHookIndex]
  const hasChangedDep = oldDeps ? deps.some((el, i) => el !== oldDeps[i]) : true
  if (!deps || hasChangedDep) {
    callback()
    wipInstance.hooks[wipHookIndex] = deps
  }
  wipHookIndex++
}

function useCallback(callback, deps) {
  const { hooks } = wipInstance
  if (hooks[wipHookIndex] && deps) {
    const [oldCallback, oldDeps] = hooks[wipHookIndex]
    if (deps.every((el, i) => el === oldDeps[i])) {
      wipHookIndex++
      return oldCallback
    }
  }
  hooks[wipHookIndex++] = [callback, deps]
  return callback
}

function useMemo(create, deps) {
  const { hooks } = wipInstance
  if (hooks[wipHookIndex] && deps) {
    const [oldValue, oldDeps] = hooks[wipHookIndex]
    if (!deps.some((el, i) => el !== oldDeps[i])) {
      wipHookIndex++
      return oldValue
    }
  }
  const newValue = create()
  hooks[wipHookIndex++] = [newValue, deps]
  return newValue
}

function useRef(initialValue) {
  const { hooks } = wipInstance
  if (!hooks[wipHookIndex]) {
    hooks[wipHookIndex] = { current: initialValue }
  }
  return hooks[wipHookIndex++]
}