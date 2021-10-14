const states = []
let calls = -1

function renderWithCrappyHooks() {
  calls = -1
}

function useState(defalutValue) {
  const callId = ++calls
  if (states[callId]) {
    return states[callId]
  }
  const setValue = (newValue) => {
    states[callId][0] = newValue
    renderWithCrappyHooks()
  }
  const tuple = [defalutValue, setValue]
  states[callId] = tuple
  return tuple
}

renderWithCrappyHooks()