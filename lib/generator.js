'use strict';

const common = require('@metarhia/common');

const types = require('./types');

const ALL_TYPES = new Set(types.STANDARD_TYPES);

const MAX_LINE_LENGTH = 80;
const SECONDARY_OFFSET = 6;

const baseUrl = 'https://developer.mozilla.org/en-US/docs/';
const primitivesBaseUrl = 'Web/JavaScript/Data_structures#';
const globalObjectsBaseUrl = 'Web/JavaScript/Reference/Global_Objects/';

const primitivesLinks = types.PRIMITIVE_TYPES.map(type =>
  [type, `${baseUrl}${primitivesBaseUrl}${common.capitalize(type)}_type`]
);

const globalObjectsLinks = types.OBJECT_TYPES.map(type =>
  [type, `${baseUrl}${globalObjectsBaseUrl}${type}`]
);

let links = [
  ...globalObjectsLinks,
  ...primitivesLinks,
  [ 'Primitive', baseUrl + 'Glossary/Primitive' ],
  [ 'Iterable', baseUrl + 'Web/JavaScript/Reference/Iteration_protocols'],
  [ 'this', baseUrl + 'Web/JavaScript/Reference/Operators/this'],
];

links = links.map(link => '[`<' + link[0] + '>`]: ' + link[1]);

const wrapType = type => {
  const arrType = [
    type.slice(0, type.length - 2),
    type.slice(type.length - 2),
  ];

  if (ALL_TYPES.has(type)) {
    return '[`<' + type + '>`]';
  } else if (ALL_TYPES.has(arrType[0]) && arrType[1] === '[]') {
    return '[`<' + arrType[0] + '[]>`][`<' + arrType[0] + '>`]';
  } else if (type.startsWith('[')) {
    const result = [];
    const nestedArr = [];
    let n = 0;
    type = type.slice(1, -1)
      .replace(/ /g, '')
      .split(',')
      .forEach(t => {
        if (n === 0 && !t.startsWith('[')) {
          result.push(t.slice(1, -1));
        } else {
          nestedArr.push(t);
          let i = 0;
          while (t[i++] === '[') n++;
          i = t.length - 1;
          while (t[i--] === ']') n--;

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

const formatLine = (line, offset, secondaryOffset = SECONDARY_OFFSET) => {
  const maxLen = MAX_LINE_LENGTH - offset;
  const pad = ' '.repeat(offset);
  const secondaryPad = ' '.repeat(offset + secondaryOffset);

  line = line.replace(/ {2}/g, ' ');
  if (line.length <= maxLen) return pad + line;

  const result = [ pad ];
  line.split(' ').forEach(word => {
    if (result[result.length - 1].length + word.length <= MAX_LINE_LENGTH) {
      result[result.length - 1] += word + ' ';
    } else {
      result.push(secondaryPad + word + ' ');
    }
  });

  return result.map(line => line.trimRight()).join('\n');
};

const generateParameters = parameters => {
  const buf = [];
  for (const parameter of parameters) {
    const types = parameter.types.map(wrapType).join('` | `');
    if (parameter.nonStandardTypes.length !== 0) {
      parameter.comment =
        parameter.nonStandardTypes.map(wrapType).join('` | `') +
        parameter.comment;
    }
    if (parameter.comment) {
      parameter.comment = ' ' + parameter.comment.trimLeft();
    }

    const line = '- `' + parameter.name + (types ? ': `' : '`') +
        types + parameter.comment;

    buf.push(formatLine(line.replace(/``/g, ''), parameter.offset));
  }
  return buf;
};

const generateRest = comments => {
  const buf = [];
  for (const comment of comments) {
    if (comment.name === 'Example' || comment.name === 'Result') {
      comment.comment = '\n```js\n' + comment.comment + '\n```';
    } else if (comment.name === 'Returns' || comment.name === 'Throws') {
      const type = common.merge(comment.types, comment.nonStandardTypes)
        .map(wrapType)
        .join('` | `')
        .replace(/``/g, '');
      comment.comment = ' ' + type + ' ' + comment.comment.trimLeft();
    }

    const line = `*${comment.name}:* ${comment.comment}`;

    if (comment.name === 'Example' || comment.name === 'Result') {
      buf.push(line);
    } else {
      buf.push(formatLine(
        line.split('\n').map(ln => ln.trim()).join(' '), 0, 4));
    }

    if (comment.parameters && comment.parameters.length) {
      buf.push(...generateParameters(comment.parameters));
    }
    buf.push('');
  }
  return buf;
};

// Generate md from interfaces inventory
//   inventory - <Map>, hash of map of records, { method, title, parameters }
// Returns: <string>, md document
const generateMd = inventory => {
  const buf = [];
  for (const [name, methods] of inventory) {
    buf.push('## Interface: ' + name + '\n');
    for (const [method, signature] of methods) {
      const args = signature.parameters
        .filter(p => p.offset === 2)
        .map(p => p.name);

      buf.push('### ' + signature.title + '\n');
      if (signature.description) buf.push(signature.description + '\n');
      buf.push(`\`${method}(${args.join(', ')})\``);
      buf.push(...generateParameters(signature.parameters), '');
      buf.push(...generateRest(signature.comments), '');
    }
  }
  buf.push(...links);
  return buf.join('\n');
};

module.exports = { generateMd };
