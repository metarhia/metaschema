'use strict';

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var common = require('@metarhia/common');

var types = require('./types');

var ALL_TYPES = new Set(types.ALL_TYPES);
var NAMED_LINES = ['Returns:', // returned value
'Example:', // example of usage
'Result:', // result of usage, should be used with `Example`
'Throws:', // thrown errors
'Deprecated:']; // Search `text` for `fn` occurrences
//   fn - <Function> | <RegExp>, to be searched
//   text - <string>, to be searched in
//   start - <number>, position to start searching from
// Returns: <Array>, lines of comments before function

var parseComments = function parseComments(fn, text, start) {
  if (start === -1) return [];
  text = text.slice(start);
  var fnIndex = fn instanceof RegExp ? text.search(fn) : text.indexOf(fn.toString());
  var lines = text.slice(0, fnIndex).split('\n').map(function (line) {
    return line.trim();
  });
  var comments = [];

  for (var i = lines.length - 2; i >= 0; i--) {
    var line = lines[i].trimLeft();
    if (!line.startsWith('//')) break;
    comments.unshift(line.slice(3));
  }

  return comments.map(function (line) {
    return line.trimRight();
  }).filter(function (line) {
    return line.length !== 0;
  });
};

var isNamedLine = function isNamedLine(line) {
  return NAMED_LINES.find(function (s) {
    return line.startsWith(s);
  });
};

var splitAtIndex = function splitAtIndex(line, index) {
  return [line.slice(0, index), line.slice(index)];
};

var splitComments = function splitComments(lines) {
  var paramStart = lines.length;
  var paramEnd = lines.length;
  var paramsStarted = false;

  for (var i = 1; i < lines.length; i++) {
    if (!paramsStarted) {
      if (lines[i].startsWith(' ')) {
        paramStart = i;
        paramsStarted = true;
      } else if (isNamedLine(lines[i])) {
        paramStart = i;
        paramEnd = i;
        break;
      }
    } else if (paramsStarted && !lines[i].startsWith(' ')) {
      paramEnd = i;
      break;
    }
  }

  return [lines.slice(1, paramStart), lines.slice(paramStart, paramEnd), lines.slice(paramEnd)];
};

var parseTypes = function parseTypes(rest) {
  var regex = new RegExp(/<[\w.]+(\[])?>/);
  var regexArr = new RegExp(/\[(<[\w.]+>,\s+)+<[\w.]+>]/);
  var comment = rest;
  var type = '';

  while (true) {
    if (comment.startsWith('<') || comment.startsWith(' | ') && comment.indexOf('<') === 3) {
      var start = comment.indexOf('<');
      var end = comment.indexOf('>') + 1;
      if (!regex.test(comment.slice(start, end))) break;
      type += comment.slice(0, end);
      comment = comment.slice(end);
    } else if (comment.startsWith('[') || comment.startsWith(' | ') && comment.indexOf('[') === 3) {
      var _start = comment.indexOf('[');

      var _end = comment.lastIndexOf(']') + 1;

      if (!regexArr.test(comment.slice(_start, _end))) break;
      type += comment.slice(0, _end);
      comment = comment.slice(_end);
    } else {
      break;
    }
  }

  if (comment.startsWith(',')) {
    comment = comment.slice(1, comment.length).trimLeft();
  }

  var types = [];
  var nonStandardTypes = [];
  type.split(' | ').map(function (s) {
    return s.startsWith('[') ? s : s.slice(1, -1);
  }).forEach(function (s) {
    var arrType = splitAtIndex(s, s.length - 2);

    if (ALL_TYPES.has(s) || ALL_TYPES.has(arrType[0]) && arrType[1] === '[]') {
      types.push(s);
    } else {
      nonStandardTypes.push(s);
    }
  });
  return [types, nonStandardTypes, comment];
};

var parseParameters = function parseParameters(lines) {
  var result = [];

  for (var i = 0; i < lines.length; i++) {
    var len = lines[i].length;
    var arg = lines[i].trimLeft();

    var _common$section = common.section(arg, ' '),
        _common$section2 = _slicedToArray(_common$section, 2),
        name = _common$section2[0],
        comment = _common$section2[1];

    var rest = comment;
    if (rest.startsWith('- ')) rest = rest.slice(2);

    if (rest.startsWith('<') || rest.startsWith('[')) {
      var _parseTypes = parseTypes(rest),
          _parseTypes2 = _slicedToArray(_parseTypes, 3),
          _types = _parseTypes2[0],
          nonStandardTypes = _parseTypes2[1],
          _comment = _parseTypes2[2];

      var offset = len - arg.length;
      result.push({
        name: name,
        types: _types,
        nonStandardTypes: nonStandardTypes,
        comment: _comment,
        offset: offset
      });
    } else {
      result[result.length - 1].comment += ' ' + arg;
    }
  }

  return result;
};

var parseRest = function parseRest(lines) {
  if (lines.length === 0) return [];
  var result = [];

  for (var i = 0; i < lines.length; i++) {
    if (isNamedLine(lines[i])) {
      var _common$section3 = common.section(lines[i], ':'),
          _common$section4 = _slicedToArray(_common$section3, 2),
          name = _common$section4[0],
          cmt = _common$section4[1];

      var _types2 = [];
      var comment = cmt;
      var nonStandardTypes = [];

      if (name === 'Returns' || name === 'Throws') {
        var _parseTypes3 = parseTypes(comment.trimLeft());

        var _parseTypes4 = _slicedToArray(_parseTypes3, 3);

        _types2 = _parseTypes4[0];
        nonStandardTypes = _parseTypes4[1];
        comment = _parseTypes4[2];
      }

      result.push({
        name: name,
        types: _types2,
        nonStandardTypes: nonStandardTypes,
        comment: comment
      });
    } else {
      result[result.length - 1].comment += '\n' + lines[i];
    }
  }

  if (result[0].name === 'Returns') {
    var parameterLines = result[0].comment.split('\n');
    var start = parameterLines.findIndex(function (line) {
      return line.startsWith('  ') && !line.startsWith(' '.repeat(4));
    });

    if (start > 0) {
      result[0].parameters = parseParameters(parameterLines.slice(start));
      result[0].comment = parameterLines.slice(0, start).join('\n');
    }
  }

  return result;
}; // Parse comments related to function
//   lines - <string[]>
// Returns: <Object>, function signature
//   title - <string>, short function description
//   description - <string>, extended function description
//   parameters - <string[]>, function parameters
//   comments - <string[]>, comments about returned value,
//       thrown errors, deprecation and usage


var parseFunction = function parseFunction(lines) {
  var sig = {
    title: lines[0] || '',
    description: '',
    parameters: [],
    comments: []
  };

  if (lines.length > 1) {
    var _splitComments = splitComments(lines),
        _splitComments2 = _slicedToArray(_splitComments, 3),
        description = _splitComments2[0],
        parameters = _splitComments2[1],
        comments = _splitComments2[2];

    sig.description = description.join('\n');
    sig.parameters = parseParameters(parameters);
    sig.comments = parseRest(comments);
  }

  return sig;
}; // Parse function signature
//   fn - <Function> | <RegExp>, to be searched
//   text - <string>, to be searched in
//   start - <number>, position to start searching from
// Returns: <Object>, function signature
//   title - <string>, short function description
//   description - <string>, extended function description
//   parameters - <string[]>, function parameters
//   comments - <string[]>, comments about returned value,
//       thrown errors, deprecation and usage


var parseSignature = function parseSignature(fn, text, start) {
  return parseFunction(parseComments(fn, text, start));
}; // Introspect interface
//   namespace - <Map>, hash of interfaces
//   text - <string>, data to parse
// Returns: <Map>, hash of hash of
//     records, { title, description, parameters, comments }


var introspect = function introspect(namespace, text) {
  var inventory = new Map();
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = namespace[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = _slicedToArray(_step.value, 2),
          name = _step$value[0],
          value = _step$value[1];

      var iface = value;
      var entities = new Map();

      var _loop = function _loop(method) {
        var fn = iface[method];
        if (typeof fn !== 'function') return "continue";
        entities.set(method, parseSignature(fn, text));
        var start = text.indexOf(method.toString());
        var standardProps = ['length', 'name', 'prototype'];
        var props = Object.getOwnPropertyNames(fn).filter(function (prop) {
          return !standardProps.includes(prop);
        });
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = props[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _prop = _step2.value;

            var _propName = "".concat(method, ".").concat(_prop);

            entities.set(_propName, parseSignature(fn[_prop], text, start));
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

        var constructorRegEx = /constructor\([\w\s,]*\)\s*{(.|\s)*}/g;

        if (fn.prototype) {
          var _props = Object.getOwnPropertyNames(fn.prototype);

          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = _props[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var prop = _step3.value;
              var propName = "".concat(method, ".prototype.").concat(prop);

              if (prop === 'constructor') {
                entities.set(propName, parseSignature(constructorRegEx, text, start));
              } else {
                entities.set(propName, parseSignature(fn.prototype[prop], text, start));
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
        }
      };

      for (var method in iface) {
        var _ret = _loop(method);

        if (_ret === "continue") continue;
      }

      inventory.set(name, entities);
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

  return inventory;
};

module.exports = {
  introspect: introspect,
  parseSignature: parseSignature
};