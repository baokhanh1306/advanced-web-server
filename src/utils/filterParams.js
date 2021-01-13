const { forEach, includes } = require("lodash")

module.exports = function (obj = {}, params = []) {
  forEach(obj, (_val, key) => {
    if (includes(params, key)) delete obj[key]
  })
  return obj
}