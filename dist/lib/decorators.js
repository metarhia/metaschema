'use strict'; // Field decorators

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ValuesDecorator = function ValuesDecorator(values) {
  _classCallCheck(this, ValuesDecorator);

  this.values = values;
};

var Enum =
/*#__PURE__*/
function (_ValuesDecorator) {
  _inherits(Enum, _ValuesDecorator);

  function Enum() {
    _classCallCheck(this, Enum);

    return _possibleConstructorReturn(this, _getPrototypeOf(Enum).apply(this, arguments));
  }

  return Enum;
}(ValuesDecorator);

var createEnum = function createEnum() {
  for (var _len = arguments.length, values = new Array(_len), _key = 0; _key < _len; _key++) {
    values[_key] = arguments[_key];
  }

  return new Enum(values);
};

var Flags =
/*#__PURE__*/
function (_ValuesDecorator2) {
  _inherits(Flags, _ValuesDecorator2);

  function Flags(values, enumDomain) {
    var _this;

    _classCallCheck(this, Flags);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Flags).call(this, values));
    _this.enum = enumDomain;
    return _this;
  }

  return Flags;
}(ValuesDecorator);

var createFlags = function createFlags() {
  for (var _len2 = arguments.length, values = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    values[_key2] = arguments[_key2];
  }

  return new Flags(values);
};

createFlags.of = function (enumDomain) {
  return new Flags(null, enumDomain);
};

var CategoryDecorator = function CategoryDecorator(category) {
  _classCallCheck(this, CategoryDecorator);

  this.category = category;
};

var List =
/*#__PURE__*/
function (_CategoryDecorator) {
  _inherits(List, _CategoryDecorator);

  function List() {
    _classCallCheck(this, List);

    return _possibleConstructorReturn(this, _getPrototypeOf(List).apply(this, arguments));
  }

  return List;
}(CategoryDecorator);

var createList = function createList(category) {
  return new List(category);
};

var Decorator = function Decorator(def) {
  _classCallCheck(this, Decorator);

  Object.assign(this, def);
};

var RelationDecorator =
/*#__PURE__*/
function (_Decorator) {
  _inherits(RelationDecorator, _Decorator);

  function RelationDecorator(def) {
    _classCallCheck(this, RelationDecorator);

    if (typeof def === 'string') {
      def = {
        category: def
      };
    }

    return _possibleConstructorReturn(this, _getPrototypeOf(RelationDecorator).call(this, def));
  }

  return RelationDecorator;
}(Decorator);

var _Many =
/*#__PURE__*/
function (_RelationDecorator) {
  _inherits(Many, _RelationDecorator);

  function Many() {
    _classCallCheck(this, Many);

    return _possibleConstructorReturn(this, _getPrototypeOf(Many).apply(this, arguments));
  }

  return Many;
}(RelationDecorator);

var _Master =
/*#__PURE__*/
function (_RelationDecorator2) {
  _inherits(Master, _RelationDecorator2);

  function Master(def) {
    _classCallCheck(this, Master);

    if (typeof def === 'string') {
      def = {
        category: def,
        required: true
      };
    }

    return _possibleConstructorReturn(this, _getPrototypeOf(Master).call(this, def));
  }

  return Master;
}(RelationDecorator);

var _Include =
/*#__PURE__*/
function (_RelationDecorator3) {
  _inherits(Include, _RelationDecorator3);

  function Include(def) {
    _classCallCheck(this, Include);

    if (typeof def === 'string') {
      def = {
        category: def,
        required: true
      };
    } else {
      def.required = true;
    }

    return _possibleConstructorReturn(this, _getPrototypeOf(Include).call(this, def));
  }

  return Include;
}(RelationDecorator); // Index decorators


var _Index2 = function Index(fields) {
  _classCallCheck(this, Index);

  this.fields = fields;
};

var _Unique =
/*#__PURE__*/
function (_Index) {
  _inherits(Unique, _Index);

  function Unique() {
    _classCallCheck(this, Unique);

    return _possibleConstructorReturn(this, _getPrototypeOf(Unique).apply(this, arguments));
  }

  return Unique;
}(_Index2); // Function decorators


var _Validate = function Validate() {
  _classCallCheck(this, Validate);
};

var _Execute = function Execute(def) {
  _classCallCheck(this, Execute);

  if (typeof def === 'string') {
    this.Action = def;
  } else {
    Object.assign(this, def);
  }
};

var _Action = function Action(def) {
  _classCallCheck(this, Action);

  if (typeof def === 'function') {
    this.Execute = def;
  } else {
    Object.assign(this, def);
  }

  if (!this.Type) this.Type = 'Custom';
  if (!this.TransactionMode) this.TransactionMode = 'All';
  if (!this.ProcessMode) this.ProcessMode = 'Any';
  if (!this.RefreshMode) this.RefreshMode = 'None';
}; // Entity decorators


var _Registry =
/*#__PURE__*/
function (_Decorator2) {
  _inherits(Registry, _Decorator2);

  function Registry() {
    _classCallCheck(this, Registry);

    return _possibleConstructorReturn(this, _getPrototypeOf(Registry).apply(this, arguments));
  }

  return Registry;
}(Decorator);

var _Dictionary =
/*#__PURE__*/
function (_Decorator3) {
  _inherits(Dictionary, _Decorator3);

  function Dictionary() {
    _classCallCheck(this, Dictionary);

    return _possibleConstructorReturn(this, _getPrototypeOf(Dictionary).apply(this, arguments));
  }

  return Dictionary;
}(Decorator);

var _System =
/*#__PURE__*/
function (_Decorator4) {
  _inherits(System, _Decorator4);

  function System() {
    _classCallCheck(this, System);

    return _possibleConstructorReturn(this, _getPrototypeOf(System).apply(this, arguments));
  }

  return System;
}(Decorator);

var _Log =
/*#__PURE__*/
function (_Decorator5) {
  _inherits(Log, _Decorator5);

  function Log() {
    _classCallCheck(this, Log);

    return _possibleConstructorReturn(this, _getPrototypeOf(Log).apply(this, arguments));
  }

  return Log;
}(Decorator);

var _Local =
/*#__PURE__*/
function (_Decorator6) {
  _inherits(Local, _Decorator6);

  function Local() {
    _classCallCheck(this, Local);

    return _possibleConstructorReturn(this, _getPrototypeOf(Local).apply(this, arguments));
  }

  return Local;
}(Decorator);

var _Table =
/*#__PURE__*/
function (_Decorator7) {
  _inherits(Table, _Decorator7);

  function Table() {
    _classCallCheck(this, Table);

    return _possibleConstructorReturn(this, _getPrototypeOf(Table).apply(this, arguments));
  }

  return Table;
}(Decorator);

var _History =
/*#__PURE__*/
function (_Decorator8) {
  _inherits(History, _Decorator8);

  function History() {
    _classCallCheck(this, History);

    return _possibleConstructorReturn(this, _getPrototypeOf(History).apply(this, arguments));
  }

  return History;
}(Decorator); // Not materialized entity decorators


var _View =
/*#__PURE__*/
function (_Decorator9) {
  _inherits(View, _Decorator9);

  function View() {
    _classCallCheck(this, View);

    return _possibleConstructorReturn(this, _getPrototypeOf(View).apply(this, arguments));
  }

  return View;
}(Decorator);

var _Projection =
/*#__PURE__*/
function (_Decorator10) {
  _inherits(Projection, _Decorator10);

  function Projection() {
    _classCallCheck(this, Projection);

    return _possibleConstructorReturn(this, _getPrototypeOf(Projection).apply(this, arguments));
  }

  return Projection;
}(Decorator);

var _Memory =
/*#__PURE__*/
function (_Decorator11) {
  _inherits(Memory, _Decorator11);

  function Memory() {
    _classCallCheck(this, Memory);

    return _possibleConstructorReturn(this, _getPrototypeOf(Memory).apply(this, arguments));
  }

  return Memory;
}(Decorator);

var _Form =
/*#__PURE__*/
function (_Decorator12) {
  _inherits(Form, _Decorator12);

  function Form() {
    _classCallCheck(this, Form);

    return _possibleConstructorReturn(this, _getPrototypeOf(Form).apply(this, arguments));
  }

  return Form;
}(Decorator);

var _Arguments =
/*#__PURE__*/
function (_Decorator13) {
  _inherits(Arguments, _Decorator13);

  function Arguments() {
    _classCallCheck(this, Arguments);

    return _possibleConstructorReturn(this, _getPrototypeOf(Arguments).apply(this, arguments));
  }

  return Arguments;
}(Decorator);

var decorators = {
  entity: {
    // Entity decorators
    Registry: function Registry(def) {
      return new _Registry(def);
    },
    Dictionary: function Dictionary(def) {
      return new _Dictionary(def);
    },
    System: function System(def) {
      return new _System(def);
    },
    Log: function Log(def) {
      return new _Log(def);
    },
    Local: function Local(def) {
      return new _Local(def);
    },
    Table: function Table(def) {
      return new _Table(def);
    },
    History: function History(def) {
      return new _History(def);
    },
    View: function View(def) {
      return new _View(def);
    },
    Projection: function Projection(def) {
      return new _Projection(def);
    },
    Memory: function Memory(def) {
      return new _Memory(def);
    },
    Form: function Form(def) {
      return new _Form(def);
    },
    Arguments: function Arguments(def) {
      return new _Arguments(def);
    }
  },
  attribute: {
    // Field decorators
    // Data types
    Enum: createEnum,
    Flags: createFlags,
    List: createList,
    // Relations
    Many: function Many(def) {
      return new _Many(def);
    },
    Master: function Master(def) {
      return new _Master(def);
    },
    Include: function Include(def) {
      return new _Include(def);
    },
    // Index decorators
    Index: function Index() {
      for (var _len3 = arguments.length, fields = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        fields[_key3] = arguments[_key3];
      }

      return new _Index2(fields);
    },
    Unique: function Unique() {
      for (var _len4 = arguments.length, fields = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        fields[_key4] = arguments[_key4];
      }

      return new _Unique(fields);
    },
    // Function decorators
    Validate: function Validate(fn) {
      return Object.setPrototypeOf(fn, _Validate);
    },
    Execute: function Execute(def) {
      return new _Execute(def);
    },
    Action: function Action(def) {
      return new _Action(def);
    }
  }
};
decorators.all = Object.assign({}, decorators.entity, decorators.attribute);
module.exports = decorators;