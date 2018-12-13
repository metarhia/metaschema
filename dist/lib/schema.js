'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var _require = require('@metarhia/common'),
    iter = _require.iter,
    Enum = _require.Enum;

var _require2 = require('./schema-errors'),
    SchemaValidationError = _require2.SchemaValidationError,
    ValidationError = _require2.ValidationError,
    MetaschemaError = _require2.MetaschemaError;

var DOMAINS_NAME = 'domains';
var addSchema = Symbol('addSchema');
var factorify = Symbol('factorify');
var initActions = Symbol('initActions');
var validate = Symbol('validate');
var REFERENCE_TYPES = new Set(['Include', 'Many', 'Master', 'Other']); // Determines type of a reference by its decorator
//   decorator - <string>
// Returns: <string>

var getReferenceType = function getReferenceType(decorator) {
  return REFERENCE_TYPES.has(decorator) ? decorator : 'Other';
}; // Extracts schema decorator
//   schema - <Object>
// Returns: <string>


var extractDecorator = function extractDecorator(schema) {
  var className = schema.constructor.name;

  if (className !== 'Function') {
    return className;
  }

  return Object.getPrototypeOf(schema).name || 'Function';
}; // Extracts category decorator type, any undecorated category
// will be treated as Local.
//   category - <Object>
// Returns: <string>


var getCategoryType = function getCategoryType(category) {
  var type = extractDecorator(category);
  return type === 'Object' ? 'Local' : type;
}; // Verifies that there could be link from source category to destination
//   source - <Object>
//   sourceName - <string>
//   destination - <Object>
//   destinationName - <string>
//   propertyName - <string>
// Returns: <SchemaValidationError> | <null> information about error or null
//          if link is valid


var verifyLink = function verifyLink(source, sourceName, destination, destinationName, propertyName) {
  var sourceType = getCategoryType(source);
  var destinationType = getCategoryType(destination);

  if (destinationType === 'Log') {
    return new SchemaValidationError('linkToLog', sourceName, propertyName);
  }

  if (destinationType === 'Local' && sourceType !== 'Local') {
    return new SchemaValidationError('illegalLinkToLocal', sourceName, propertyName, {
      destination: destinationName
    });
  }

  return null;
}; // Crosslink loaded schema
//   schemas - <Iterable> schema collection (in the form [name, schema])
//   categories - <Map> available categories
//   domains - <Map> available domains
// Returns: <MetaschemaError> | <null>


var linkSchemas = function linkSchemas(schemas, categories, domains) {
  var errors = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = schemas[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = _slicedToArray(_step.value, 2),
          schemaName = _step$value[0],
          schema = _step$value[1];

      for (var fieldName in schema) {
        var field = schema[fieldName];

        if (field.domain) {
          var domain = domains.get(field.domain);

          if (domain) {
            field.definition = domain;
          } else {
            errors.push(new SchemaValidationError('unresolvedDomain', schemaName, fieldName, {
              domain: field.domain
            }));
          }
        } else if (field.category) {
          var category = categories.get(field.category);

          if (!category) {
            errors.push(new SchemaValidationError('unresolvedCategory', schemaName, fieldName, {
              category: field.category
            }));
            continue;
          }

          var categoryDefinition = category.definition;
          var error = verifyLink(schema, schemaName, categoryDefinition, field.category, fieldName);

          if (error) {
            errors.push(error);
            continue;
          }

          field.definition = categoryDefinition;
          var type = getReferenceType(extractDecorator(field));
          category.references[type].push({
            category: schemaName,
            property: fieldName
          });
        }
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return errors.length ? new MetaschemaError(errors) : null;
};

var extractDefinition = function extractDefinition(definition, path, ms) {
  var separatorIndex = path.indexOf('.');

  if (separatorIndex === -1) {
    return definition[path];
  }

  var property = path.slice(0, separatorIndex);
  var categoryName = definition[property].category;
  var category = ms.categories.get(categoryName).definition;
  return extractDefinition(category, path.slice(separatorIndex + 1), ms);
};

var processView = function processView(view, ms) {
  if (view.definition) {
    return;
  }

  view.definition = {};
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = view.Fields[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var field = _step2.value;
      var props = typeof field === 'string' ? _defineProperty({}, field, field) : field;

      for (var key in props) {
        var prop = props[key];

        if (typeof prop !== 'string') {
          view.definition[key] = prop;
          continue;
        }

        var schema = ms.categories.get(view.Category);

        if (!schema) {
          schema = ms.views.get(view.Category);
          processView(schema, ms);
        }

        view.definition[key] = extractDefinition(schema.definition, prop, ms);
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }
};

var processViews = function processViews(ms) {
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = ms.views.values()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var schema = _step3.value;
      processView(schema, ms);
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }
};

var processFields = function processFields(ms, category, fields) {
  for (var key in fields) {
    var arg = fields[key];
    Object.assign(arg, arg.domain ? {
      domain: arg.domain,
      definition: ms.domains.get(arg.domain)
    } : extractDefinition(category, arg.field, ms));
  }
};

var processForms = function processForms(ms) {
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = ms.forms[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var _step4$value = _slicedToArray(_step4.value, 2),
          name = _step4$value[0],
          form = _step4$value[1];

      var dot = name.indexOf('.');
      var categoryName = name.slice(0, dot);
      var category = ms.categories.get(categoryName).definition;
      processFields(ms, category, form.Args);
      processFields(ms, category, form.Returns);
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }
};

var domainValidators = {
  string: function string(domain, prop, value) {
    var errors = [];

    if (domain.min !== undefined && value.length < domain.min) {
      errors.push(new ValidationError('domainValidation', prop, 'min'));
    }

    if (domain.length !== undefined && value.length > domain.length) {
      errors.push(new ValidationError('domainValidation', prop, 'length'));
    }

    return errors;
  },
  number: function number(domain, prop, value) {
    var errors = []; // The condition is inverted because of possible NaN

    if (domain.min !== undefined && !(value >= domain.min)) {
      errors.push(new ValidationError('domainValidation', prop, 'min'));
    } // The condition is inverted because of possible NaN


    if (domain.max !== undefined && !(value <= domain.max)) {
      errors.push(new ValidationError('domainValidation', prop, 'max'));
    }

    if (domain.subtype === 'int' && !Number.isInteger(value)) {
      errors.push(new ValidationError('domainValidation', prop, 'subtype'));
    }

    return errors;
  },
  object: function object(domain, prop, value) {
    var errors = [];
    var valueClass = value.constructor.name;

    if (domain.class !== valueClass) {
      errors.push(new ValidationError('invalidClass', prop, {
        expected: domain.class,
        actual: valueClass
      }));
      return errors;
    }

    if (domain.length !== undefined && (value.length === undefined || value.length > domain.length)) {
      errors.push(new ValidationError('domainValidation', prop, 'length'));
    }

    return errors;
  },
  bigint: function bigint() {
    return [];
  },
  boolean: function boolean() {
    return [];
  },
  function: function _function() {
    return [];
  },
  symbol: function symbol() {
    return [];
  }
}; // Validates value against a domain
//   value - <any>
//   path - <string>
//   domain - <Object>
// Returns: <ValidationError[]>

var validateDomain = function validateDomain(value, path, domain) {
  var errors = [];
  var domainType = extractDecorator(domain);

  if (domain.type) {
    var type = _typeof(value);

    if (type !== domain.type) {
      errors.push(new ValidationError('invalidType', path, {
        expected: domain.type,
        actual: type
      }));
      return errors;
    }

    var validator = domainValidators[type];
    errors.push.apply(errors, _toConsumableArray(validator(domain, path, value)));
  }

  if (domainType === 'Enum') {
    if (!domain.values.includes(value)) {
      errors.push(new ValidationError('enum', path, {
        expected: domain.values,
        actual: value
      }));
    }
  }

  if (domainType === 'Flags') {
    var valueClass = value.constructor.name;

    if (valueClass !== 'Uint64' && valueClass !== 'FlagsClass') {
      errors.push(new ValidationError('invalidClass', path, {
        expected: ['Uint64', 'FlagsClass'],
        actual: valueClass
      }));
    }
  }

  if (domain.check && !domain.check(value)) {
    errors.push(new ValidationError('domainValidation', path, 'check'));
  }

  return errors;
};

var validateLink = function validateLink(value, path, definition, ms, patch) {
  var errors = [];
  var category = definition.definition;
  var type = extractDecorator(definition);

  if (type === 'Include') {
    return ms[validate](category, value, patch, "".concat(path, "."));
  }

  var checkLink = function checkLink(value, path) {
    var valueClass = value.constructor.name;

    if (valueClass !== 'Uint64' && valueClass !== 'String') {
      errors.push(new ValidationError('invalidClass', path, {
        expected: ['Uint64', 'String'],
        actual: valueClass
      }));
    }
  };

  if (type === 'Many') {
    if (!Array.isArray(value)) {
      errors.push(new ValidationError('invalidType', "".concat(path), {
        expected: 'Array',
        actual: _typeof(value)
      }));
    } else {
      value.forEach(function (val, index) {
        return checkLink(val, "".concat(path, "[").concat(index, "]"));
      });
    }
  } else {
    checkLink(value, path);
  }

  return errors;
};

var Metaschema =
/*#__PURE__*/
function () {
  function Metaschema() {
    _classCallCheck(this, Metaschema);

    this.domains = new Map();
    this.categories = new Map();
    this.forms = new Map();
    this.views = new Map();
    this.actions = new Map();
    this.sources = [];
  } // Internal add schema, only processes the `schema`
  // but doesn't do anything else (i.e. linking)


  _createClass(Metaschema, [{
    key: addSchema,
    value: function value(name, schema, source) {
      this.sources.push(source);

      if (name === DOMAINS_NAME) {
        for (var _name in schema) {
          var domain = schema[_name];
          var decorator = extractDecorator(domain);

          if (decorator === 'Flags' && domain.enum) {
            var enumDomain = schema[domain.enum];
            domain.values = enumDomain.values;
          }

          this.domains.set(_name, domain);
        }
      } else {
        var _decorator = extractDecorator(schema);

        if (_decorator === 'Form') {
          this.forms.set(name, schema);
        } else if (_decorator === 'View' || _decorator === 'Projection') {
          this.views.set(name, schema);
        } else {
          var factory = this[factorify](name, schema);
          this.categories.set(name, {
            name: name,
            definition: schema,
            factory: factory,
            references: iter(REFERENCE_TYPES).reduce(function (references, type) {
              references[type] = [];
              return references;
            }, {})
          });
        }
      }
    } // Create category instance
    //   def - <Object> | <string> field definition
    //   value - <any> value to check/create
    // Returns: instance of `def`

  }, {
    key: "createInstance",
    value: function createInstance(def, value) {
      var _this = this;

      var name;
      if (typeof def === 'string') name = def;else name = def.category || def.domain;
      var decorator = extractDecorator(def);
      var category = this.categories.get(name);

      if (category && category.factory) {
        return category.factory(value);
      }

      if (decorator === 'List') {
        var cat = this.categories.get(def.category);
        if (!cat) return null;
        var checked = value.map(function (v) {
          return _this.createInstance(cat, v);
        });
        if (checked.some(function (v) {
          return v === null;
        })) return null;
        return checked;
      }

      var domain = this.domains.get(name);

      var type = _typeof(value);

      var expected = domain ? domain.type : name;
      if (type === expected) return value;
      return null;
    } // Create factory from category definition
    //   name - <string> category name
    //   definition - <Object> category definition
    // Returns: function, (...args)

  }, {
    key: factorify,
    value: function value(name, definition) {
      var _this2 = this;

      var properties = Object.keys(definition);
      var required = new Set(properties.filter(function (p) {
        return definition[p].required;
      }));

      var factory = function factory() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var instance = args[0];
        if (args.length > 1) instance = args;
        var obj = {};
        var fields, len, field, value;
        var isArr = Array.isArray(instance);

        if (isArr) {
          len = Math.min(properties.length, instance.length);
        } else {
          fields = Object.keys(instance).filter(function (field) {
            return properties.includes(field);
          });
          len = fields.length;
        }

        for (var i = 0; i < len; i++) {
          if (isArr) {
            field = properties[i];
            value = instance[i];
          } else {
            field = fields[i];
            value = instance[field];
          }

          var def = definition[field];

          if (typeof def === 'function') {
            value = def(value);
            obj[field] = value;
          } else {
            value = _this2.createInstance(def, value);
            if (value !== null) obj[field] = value;else return null;
          }
        }

        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = required[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var prop = _step5.value;

            if (obj[prop] === null || obj[prop] === undefined) {
              return null;
            }
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return != null) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }

        return obj;
      };

      return factory;
    } // Validate object against a schema
    //   schema - <Object>, schema to validate against
    //   object - <Object>, object to validate
    //   patch - <boolean>, flag to determine if the object contains patch or
    //       value, default: `false`
    //   path - <string>, path to an object, for nested objects, default: `''`
    // Returns: <ValidationError[]>

  }, {
    key: validate,
    value: function value(schema, object) {
      var patch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var path = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
      var errors = [];
      var schemaProps = new Set(Object.keys(schema));
      var objectProps = new Set(Object.keys(object));
      var props = new Set(_toConsumableArray(schemaProps).concat(_toConsumableArray(objectProps)));
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = props[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var prop = _step6.value;
          var isSchemaProp = schemaProps.has(prop);
          var isObjectProp = objectProps.has(prop);

          if (isObjectProp && !isSchemaProp) {
            errors.push(new ValidationError('unresolvedProperty', "".concat(path).concat(prop)));
            continue;
          }

          var definition = schema[prop];

          if (extractDecorator(definition) === 'Validate' && !patch) {
            if (!definition(object)) {
              errors.push(new ValidationError('validation', "".concat(path).concat(prop)));
            }

            continue;
          }

          if (definition.readOnly && patch) {
            errors.push(new ValidationError('immutable', "".concat(path).concat(prop)));
            continue;
          }

          if (!isObjectProp) {
            if (definition.required && !patch) {
              errors.push(new ValidationError('missingProperty', "".concat(path).concat(prop)));
            }

            continue;
          }

          var value = object[prop];

          if (value === undefined || value === null) {
            if (definition.required) {
              errors.push(new ValidationError('emptyValue', "".concat(path).concat(prop)));
            }

            continue;
          }

          if (definition.domain) {
            errors.push.apply(errors, _toConsumableArray(validateDomain(value, "".concat(path).concat(prop), definition.definition)));
          } else if (definition.category) {
            errors.push.apply(errors, _toConsumableArray(validateLink(value, "".concat(path).concat(prop), definition, this, patch)));
          }

          if (definition.validate && !definition.validate(value)) {
            errors.push(new ValidationError('propValidation', "".concat(path).concat(prop)));
          }
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return != null) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }

      return errors;
    } // Validate instance against a category
    //   categoryName - <string>, category name
    //   instance - <any>, instance to validate
    //   patch - <boolean>, flag to determine if the object contains patch or
    //       value, default: `false`
    //   path - <string>, path to an object, for nested objects, default: `''`
    // Returns: <MetaschemaError> | <null>

  }, {
    key: "validateCategory",
    value: function validateCategory(categoryName, instance) {
      var patch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var path = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
      var category = this.categories.get(categoryName);

      if (!category) {
        return new MetaschemaError([new ValidationError('undefinedEntity', categoryName, 'category')]);
      }

      var errors = this[validate](category.definition, instance, patch, "".concat(path).concat(categoryName, "."));
      return errors.length === 0 ? null : new MetaschemaError(errors);
    } // Validate instance against a category
    //   formName - <string>, form name
    //   args - <Object>, form arguments
    // Returns: <MetaschemaError> | <null>

  }, {
    key: "validateForm",
    value: function validateForm(formName, args) {
      var form = this.forms.get(formName);

      if (!form) {
        return new MetaschemaError([new ValidationError('undefinedEntity', formName, 'form')]);
      }

      var errors = this[validate](form.Args, args, false, "".concat(formName, "."));
      return errors.length === 0 ? null : new MetaschemaError(errors);
    } // Validate fields of an instance against a category
    //   category - <string>, category name
    //   instance - <any>, instance to validate
    // Returns: <MetaschemaError> | <null>

  }, {
    key: "validateFields",
    value: function validateFields(category, instance) {
      var errors = [];

      for (var key in instance) {
        var val = instance[key];
        var err = this.validateCategory(category, val, false, "".concat(key, "."));
        if (err) errors.push.apply(errors, _toConsumableArray(err.errors));
      }

      return errors.length === 0 ? null : new MetaschemaError(errors);
    }
  }, {
    key: "buildCategory",
    value: function buildCategory(category) {
      var _this$categories$get;

      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      return (_this$categories$get = this.categories.get(category)).factory.apply(_this$categories$get, args);
    }
  }, {
    key: initActions,
    value: function value() {
      var _this3 = this;

      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        var _loop = function _loop() {
          var _step7$value = _slicedToArray(_step7.value, 2),
              categoryName = _step7$value[0],
              category = _step7$value[1].definition;

          var actions = iter(Object.keys(category)).filter(function (key) {
            return extractDecorator(category[key]) === 'Action';
          }).map(function (key) {
            // TODO(lundibundi): remove and replace once
            // https://github.com/metarhia/metaschema/pull/125 lands
            var setEnumField = function setEnumField(def, field, domainName) {
              var domain = _this3.domains.get(domainName);

              if (def[field].constructor.name !== 'EnumClass') {
                var enumClass = Enum.from.apply(Enum, _toConsumableArray(domain.values));
                def[field] = enumClass.from(def[field]);
              }
            };

            var def = category[key];
            setEnumField(def, 'Type', 'ActionType');
            setEnumField(def, 'TransactionMode', 'TransactionMode');
            setEnumField(def, 'ProcessMode', 'ProcessMode');
            setEnumField(def, 'RefreshMode', 'RefreshMode');
            var action = {
              categoryName: categoryName,
              name: key,
              definition: category[key],
              form: _this3.forms.get("".concat(categoryName, ".").concat(def.Form || key))
            };
            return [key, action];
          }).collectTo(Map);

          _this3.actions.set(categoryName, actions);
        };

        for (var _iterator7 = this.categories[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          _loop();
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return != null) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }
    }
  }]);

  return Metaschema;
}(); // Creates Metaschema instance
//   schemas - <Iterable> schemas in form [name, schema, source]
//             (the 'source' is optional)
// Returns: [<MetaschemaError>, <Metaschema>]


var create = function create(schemas) {
  var ms = new Metaschema();
  var _iteratorNormalCompletion8 = true;
  var _didIteratorError8 = false;
  var _iteratorError8 = undefined;

  try {
    for (var _iterator8 = schemas[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
      var _step8$value = _slicedToArray(_step8.value, 3),
          name = _step8$value[0],
          schema = _step8$value[1],
          source = _step8$value[2];

      ms[addSchema](name, schema, source);
    }
  } catch (err) {
    _didIteratorError8 = true;
    _iteratorError8 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion8 && _iterator8.return != null) {
        _iterator8.return();
      }
    } finally {
      if (_didIteratorError8) {
        throw _iteratorError8;
      }
    }
  }

  ms[initActions]();
  var error = linkSchemas(schemas, ms.categories, ms.domains);

  if (error) {
    return [error, ms];
  }

  processViews(ms);
  processForms(ms);
  return [null, ms];
};

module.exports = {
  create: create,
  addSchema: addSchema,
  extractDecorator: extractDecorator,
  getReferenceType: getReferenceType
};