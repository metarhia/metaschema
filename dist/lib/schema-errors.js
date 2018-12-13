'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _construct(Parent, args, Class) { if (isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var schemaValidationErrorSerializers = {
  linkToLog: function linkToLog(error) {
    return 'Forbidden reference to a \'Log\' category ' + "from ".concat(error.source, ".").concat(error.property);
  },
  illegalLinkToLocal: function illegalLinkToLocal(error) {
    return 'Illegal reference to a \'Local\' category' + " '".concat(error.info.destination, "' from ").concat(error.source, ".").concat(error.property);
  },
  unresolvedDomain: function unresolvedDomain(error) {
    return 'Reference to an unresolved domain' + " '".concat(error.info.domain, "' from ").concat(error.source, ".").concat(error.property);
  },
  unresolvedCategory: function unresolvedCategory(error) {
    return 'Reference to an unresolved category' + " '".concat(error.info.category, "' from ").concat(error.source, ".").concat(error.property);
  }
};

var SchemaValidationError =
/*#__PURE__*/
function (_Error) {
  _inherits(SchemaValidationError, _Error);

  function SchemaValidationError(type, source, property, info) {
    var _this;

    _classCallCheck(this, SchemaValidationError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(SchemaValidationError).call(this));
    _this.type = type;
    _this.source = source;
    _this.property = property;
    _this.info = info;
    return _this;
  }

  _createClass(SchemaValidationError, [{
    key: "toString",
    value: function toString() {
      return schemaValidationErrorSerializers[this.type](this);
    }
  }]);

  return SchemaValidationError;
}(_wrapNativeSuper(Error));

var wrap = function wrap(value) {
  return Array.isArray(value) ? value.map(wrap).join(', ') : "'".concat(value, "'");
};

var validationErrorSerializers = {
  unresolvedProperty: function unresolvedProperty(error) {
    return "Unresolved property '".concat(error.property, "'");
  },
  missingProperty: function missingProperty(error) {
    return "Missing property '".concat(error.property, "'");
  },
  emptyValue: function emptyValue(error) {
    return "Empty value in required property '".concat(error.property, "'");
  },
  validation: function validation(error) {
    return "Failed to validate rule '".concat(error.property, "'");
  },
  propValidation: function propValidation(error) {
    return "Failed to validate property '".concat(error.property, "'");
  },
  immutable: function immutable(error) {
    return "Mutation of read-only property '".concat(error.property, "'");
  },
  invalidType: function invalidType(error) {
    return "Invalid type of property '".concat(error.property, "', ") + "expected: '".concat(error.info.expected, "', actual: '").concat(error.info.actual, "'");
  },
  invalidClass: function invalidClass(error) {
    return "Invalid class of property '".concat(error.property, "', ") + "expected: ".concat(wrap(error.info.expected), ", actual: '").concat(error.info.actual, "'");
  },
  domainValidation: function domainValidation(error) {
    return "Failed to validate rule '".concat(error.info, "' on property '").concat(error.property, "'");
  },
  enum: function _enum(error) {
    return "Invalid value of a enum in a property '".concat(error.property, "' ") + "allowed: ".concat(wrap(error.info.expected), ", actual: '").concat(error.info.actual, "'");
  },
  undefinedEntity: function undefinedEntity(error) {
    return "Undefined ".concat(error.info, " '").concat(error.property, "'");
  }
};

var ValidationError =
/*#__PURE__*/
function (_Error2) {
  _inherits(ValidationError, _Error2);

  function ValidationError(type, property, info) {
    var _this2;

    _classCallCheck(this, ValidationError);

    _this2 = _possibleConstructorReturn(this, _getPrototypeOf(ValidationError).call(this));
    _this2.type = type;
    _this2.property = property;
    _this2.info = info;
    return _this2;
  }

  _createClass(ValidationError, [{
    key: "toString",
    value: function toString() {
      return validationErrorSerializers[this.type](this);
    }
  }]);

  return ValidationError;
}(_wrapNativeSuper(Error));

var MetaschemaError =
/*#__PURE__*/
function (_Error3) {
  _inherits(MetaschemaError, _Error3);

  function MetaschemaError(errors) {
    var _this3;

    _classCallCheck(this, MetaschemaError);

    _this3 = _possibleConstructorReturn(this, _getPrototypeOf(MetaschemaError).call(this));
    _this3.errors = errors;
    return _this3;
  }

  _createClass(MetaschemaError, [{
    key: "toString",
    value: function toString() {
      return this.errors.map(function (e) {
        return e.toString();
      }).join('\n');
    }
  }]);

  return MetaschemaError;
}(_wrapNativeSuper(Error));

module.exports = {
  SchemaValidationError: SchemaValidationError,
  ValidationError: ValidationError,
  MetaschemaError: MetaschemaError
};