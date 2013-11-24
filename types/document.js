var Schema = require('../lib/schema')
var type = require('type-component')
var mpath = require('mpath')
var ValidationError = require('../errors/validation.js')

exports = module.exports = Schema.extend(Document)

function Document(settings, key, parent) {
  if (!(this instanceof Document)) return new Document(settings, key, parent)
  // support shorthand `new Document({user: String})` if schema is not defined
  if (!settings.hasOwnProperty('schema'))
    settings = {schema: settings}
  Schema.call(this, settings, key, parent)
  var schema = this.get('schema')
  this.set('schema', this.tree = {})
  this.add(schema)
}

Document.cast(function (object, parent, target) {
  if (object === undefined || object === null) return object;
  var target = target || {}
    , errors = new ValidationError(this)
    , has_errors = false
    , schema = this.tree

  map(object, target, function(key, value) {
    try {
     return schema[key] ? schema[key].cast(value, target) : value
    } catch (err) {
      errors.add(key, err)
      has_errors = true
    }
  })

  if (has_errors) throw errors
  else return target
})

Document.validate(function(document, settings, strict, callback) {
  var schema = this.tree
  Schema.validate(document, settings, strict, function (errors) {
    if (errors && strict) {
      callback(errors, false)
    } else {
     validate_children(errors || new ValidationError(this), schema, document, settings, strict, callback) 
    }
  })
})

function validate_children(errors, schema, document, settings, strict, callback) {
  var has_errors = false
    , pending = 0
    , cancelled = false
    , keys = Object.keys(document)

  for (var i = 0; i < keys[i] && !cancelled; i++, pending++) {
    var key = keys[i]
      , value = value[key]

    if (schema[key]) {
      validate(schema, key, value, settings, strict, done)
    } else if (this.disabled('adhoc')) {
      done(key, new TypeError('adhoc properties are not allowed on this document'))
    }
  }
  // handle errors
  function done(key, error) {
    if (error) {
      errors.add(key, error)
      has_errors = true
      if (strict) {
        pending = 1
        cancelled = true
      }
    }
    if (--pending === 0) callback(has_errors && errors, has_errors)
  }
}

function validate(schema, key, value, settings, strict, callback) {
  schema[key].validate(value, function(error) {
    callback(key, error)
  })
}

Document.prototype.add = function(obj, prefix) {
  prefix = prefix || ''
  Object.keys(obj)
  .forEach(function(key) {
    if (!obj[key]) {
      throw new TypeError('Invalid for schema at path `' + prefix + key + '`')
    }
    this.attr(prefix + key, obj[key])
  }, this)
}

Document.prototype.attr = function(path, obj) {
  if (obj === undefined)
    return mpath.get(path, this, 'tree')
  else {
    var type = this.type.infer(obj, path.split('.').pop(), this)
    mpath.set(path, type, this, 'tree')
  }
  return this
}


function map(object, target, fn) {
  if (type(object) !== 'object') throw new TypeError('must be an object')
  var seen = []
    , cache = []
  Object.keys(object)
  .forEach(function(key) {
    var index = seen.indexOf(object[key])
      , value = index > -1 
          ? cache[index] 
          : (cache[seen.push(object[key])] = fn(key, object[key]))
     if (target) target[key] = value
  })
}
function cast(type, value, parent) {
  if (type) return type.cast(value, parent)
  else return value
}

