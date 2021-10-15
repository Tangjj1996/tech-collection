const formatResult = (isPass = false, errMsg = "") => {
  return {
    result: isPass,
    msg: errMsg
  }
}

const validStrategies = {
  isNonEmpty: function(val = "") {
    if (!val) {
      return formatResult(false, "内容不能为空")
    }
  },
  minLength: function(val = "", length = 0) {
    if (typeof length === "string") {
      length = parseInt(length)
    }
    if (val.length < length) {
      return formatResult(false, `内容长度不能小于 ${length}`)
    }
  },
  maxLength: function(val = "", length = 0) {
    if (typeof length === 'string') {
      length = parseInt(length)
    }
    if (val.length < length) {
      return formatResult(false, `内容长度不能大于 ${length}`)
    }
  },
  default: function() {
    return formatResult(true)
  }
}

class Validator {
  constructor() {
    this._ruleExecuters = []
  }
  addRule(value = "", rules = []) {
    this._ruleExecuters = []
    rules.forEach(rule => {
      const args = rule.split(":")
      const functionName = args.shift() || "defalut"
      const ruleFunc = validStrategies[functionName].bind(this, value)
      this._ruleExecuters.push({
        func: ruleFunc,
        args
      })
    })
    return this
  }
  valid() {
    for (let i = 0, len = this._ruleExecuters.length; i < len; i++) {
      const res = this._ruleExecuters[i].func.apply(this, this._ruleExecuters[i].args)
      if (res && !res.result) {
        return res
      }
    }
    return formatResult(true)
  }
}

const v = new Validator()
const res = v.addRule("123", [
  "isNonEmpty",
  "minLength:5",
  "maxLength:12"
]).valid()

console.log("res: ", res)