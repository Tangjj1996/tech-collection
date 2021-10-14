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

function render(element, parentDom) {
  const { type, props, children = [] } = element
  const dom = type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(type)
  // Set properties
  Object.keys(props).forEach(name => {
    dom[name] = props[name]
  })
  // Render children
  children.forEach(childrenElement => render(childrenElement, dom))
  parentDom.appendChild(dom)
}

const TinyReact = {
  createElement,
  render
}

let rootInstance = null

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
  } else if (instance.element.type === element.type) {
    // Update instance
    if (typeof element.type === 'function') {
      const childElement = element.type(element.props)
      const oldChildInstance = instance.childInstance
      const childInstance = recocile(parentDom, oldChildInstance, childElement)
      instance.dom = childInstance.dom
      instance.element = element
      instance.childInstance = childInstance
      return instance
    } else {
      updateDomProperties(instance.dom, instance.element.props, element.props)
      instance.childInstances = recocileChildren(instance, element)
      instance.element = element
      return instance
    }
  } else {
    // Repalce instance
    const newInstance = instantiate(element)
    parentDom.replaceChild(newInstance.dom, instance.dom)
    return newInstance
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
    const childElement = type(props)
    const childInstance = instantiate(childElement)
    return {
      dom: childInstance.dom,
      element,
      childInstance
    }
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