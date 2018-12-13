'use strict';

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var common = require('@metarhia/common');

var types = require('./types');

var ALL_TYPES = new Set(types.STANDARD_TYPES);
var MAX_LINE_LENGTH = 80;
var SECONDARY_OFFSET = 6;
var baseUrl = 'https://developer.mozilla.org/en-US/docs/';
var primitivesBaseUrl = 'Web/JavaScript/Data_structures#';
var globalObjectsBaseUrl = 'Web/JavaScript/Reference/Global_Objects/';
var primitivesLinks = types.PRIMITIVE_TYPES.map(function (type) {
  return [type, "".concat(baseUrl).concat(primitivesBaseUrl).concat(common.capitalize(type), "_type")];
});
var globalObjectsLinks = types.OBJECT_TYPES.map(function (type) {
  return [type, "".concat(baseUrl).concat(globalObjectsBaseUrl).concat(type)];
});

var links = _toConsumableArray(globalObjectsLinks).concat(_toConsumableArray(primitivesLinks), [['Primitive', baseUrl + 'Glossary/Primitive'], ['Iterable', baseUrl + 'Web/JavaScript/Reference/Iteration_protocols'], ['this', baseUrl + 'Web/JavaScript/Reference/Operators/this']]);

links = links.map(function (link) {
  return '[`<' + link[0] + '>`]: ' + link[1];
});

var wrapType = function wrapType(type) {
  var arrType = [type.slice(0, type.length - 2), type.slice(type.length - 2)];

  if (ALL_TYPES.has(type)) {
    return '[`<' + type + '>`]';
  } else if (ALL_TYPES.has(arrType[0]) && arrType[1] === '[]') {
    return '[`<' + arrType[0] + '[]>`][`<' + arrType[0] + '>`]';
  } else if (type.startsWith('[')) {
    var result = [];
    var nestedArr = [];
    var n = 0;
    type = type.slice(1, -1).replace(/ /g, '').split(',').forEach(function (t) {
      if (n === 0 && !t.startsWith('[')) {
        result.push(t.slice(1, -1));
      } else {
        nestedArr.push(t);
        var i = 0;

        while (t[i++] === '[') {
          n++;
        }

        i = t.length - 1;

        while (t[i--] === ']') {
          n--;
        }

        if (n === 0) {
          result.push(nestedArr.join(','));
          nestedArr.length = 0;
        }
      }
    });
    return '`[ `' + result.map(wrapType).join('`, `') + '` ]`';
  } else {
    return '`<' + type + '>`';
  }
};

var formatLine = function formatLine(line, offset) {
  var secondaryOffset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : SECONDARY_OFFSET;
  var maxLen = MAX_LINE_LENGTH - offset;
  var pad = ' '.repeat(offset);
  var secondaryPad = ' '.repeat(offset + secondaryOffset);
  line = line.replace(/ {2}/g, ' ');
  if (line.length <= maxLen) return pad + line;
  var result = [pad];
  line.split(' ').forEach(function (word) {
    if (result[result.length - 1].length + word.length <= MAX_LINE_LENGTH) {
      result[result.length - 1] += word + ' ';
    } else {
      result.push(secondaryPad + word + ' ');
    }
  });
  return result.map(function (line) {
    return line.trimRight();
  }).join('\n');
};

var generateParameters = function generateParameters(parameters) {
  var buf = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = parameters[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var parameter = _step.value;

      var _types = parameter.types.map(wrapType).join('` | `');

      if (parameter.nonStandardTypes.length !== 0) {
        parameter.comment = parameter.nonStandardTypes.map(wrapType).join('` | `') + parameter.comment;
      }

      if (parameter.comment) {
        parameter.comment = ' ' + parameter.comment.trimLeft();
      }

      var line = '- `' + parameter.name + (_types ? ': `' : '`') + _types + parameter.comment;
      buf.push(formatLine(line.replace(/``/g, ''), parameter.offset));
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

  return buf;
};

var generateRest = function generateRest(comments) {
  var buf = [];
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = comments[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var comment = _step2.value;

      if (comment.name === 'Example' || comment.name === 'Result') {
        comment.comment = '\n```js\n' + comment.comment + '\n```';
      } else if (comment.name === 'Returns' || comment.name === 'Throws') {
        var type = common.merge(comment.types, comment.nonStandardTypes).map(wrapType).join('` | `').replace(/``/g, '');
        comment.comment = ' ' + type + ' ' + comment.comment.trimLeft();
      }

      var line = "*".concat(comment.name, ":* ").concat(comment.comment);

      if (comment.name === 'Example' || comment.name === 'Result') {
        buf.push(line);
      } else {
        buf.push(formatLine(line.split('\n').map(function (ln) {
          return ln.trim();
        }).join(' '), 0, 4));
      }

      if (comment.parameters && comment.parameters.length) {
        buf.push.apply(buf, _toConsumableArray(generateParameters(comment.parameters)));
      }

      buf.push('');
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

  return buf;
}; // Generate md from interfaces inventory
//   inventory - <Map>, hash of map of records, { method, title, parameters }
// Returns: <string>, md document


var generateMd = function generateMd(inventory) {
  var buf = [];
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = inventory[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var _step3$value = _slicedToArray(_step3.value, 2),
          name = _step3$value[0],
          methods = _step3$value[1];

      buf.push('## Interface: ' + name + '\n');
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = methods[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _step4$value = _slicedToArray(_step4.value, 2),
              method = _step4$value[0],
              signature = _step4$value[1];

          var args = signature.parameters.filter(function (p) {
            return p.offset === 2;
          }).map(function (p) {
            return p.name;
          });
          buf.push('### ' + signature.title + '\n');
          if (signature.description) buf.push(signature.description + '\n');
          buf.push("`".concat(method, "(").concat(args.join(', '), ")`"));
          buf.push.apply(buf, _toConsumableArray(generateParameters(signature.parameters)).concat(['']));
          buf.push.apply(buf, _toConsumableArray(generateRest(signature.comments)).concat(['']));
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

  buf.push.apply(buf, _toConsumableArray(links));
  return buf.join('\n');
};

module.exports = {
  generateMd: generateMd
};