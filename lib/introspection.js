'use strict';

const common = require('metarhia-common');
const { last } = common;

const { ALL_TYPES } = require('./types');

const FUNC_TERMS = [') {', ') => {', ') => ('];
const NAMED_LINES = ['Example:', 'Returns:', 'Hint:', 'Result:'];

const indexing = s => term => s.indexOf(term);

const parseLines = (
  // Parse signature lines
  s, // string, signature lines
  signature // record, { title, description, parameters, comments }
  // Returns: array of string
) => {
  let lines = s.split('\n');
  lines.pop();
  signature.title = (lines.shift() || '').replace('//', '').trim();
  lines = lines.map(
    d => d.trim().replace(/^(.*) \/\//, '$1:').replace(',:', ':')
  );
  for (let line of lines) {
    if (line.startsWith('//')) {
      line = line.replace(/^\/\/ /, '').trim();
      if (NAMED_LINES.find(s => line.startsWith(s))) {
        const [name, comment] = common.section(line, ': ');
        signature.comments.push({ name, comment });
      } else if (signature.parameters.length === 0) {
        if (signature.description.length > 0) {
          signature.description += '\n';
        }
        signature.description += line;
      } else {
        const par = last(signature.parameters);
        par.comment += '\n' + line;
      }
    } else {
      const [name, text] = common.section(line, ': ');
      let [type, comment] = common.section(text, ', ');
      if (!ALL_TYPES.find(s => type.startsWith(s))) {
        comment = type;
        type = '';
      }
      signature.parameters.push({ name, type, comment });
    }
  }
};

const parseSignature = (
  // Parse function signature
  fn // function, method
  // Returns: { title, description, parameters, comments }
) => {
  const signature = {
    title: '', description: '',
    parameters: [], comments: []
  };
  let s = fn.toString();
  let pos = FUNC_TERMS.map(indexing(s))
    .filter(k => k !== -1)
    .reduce((prev, cur) => (prev < cur ? prev : cur), s.length);
  if (pos !== -1) {
    s = s.substring(0, pos);
    pos = s.indexOf('\n');
    s = s.substring(pos + 1);
    parseLines(s, signature);
  }
  return signature;
};

const introspect = (
  // Introspect interface
  namespace // hash of interfaces
  // Returns: hash of hash of record, { method, title, parameters }
) => {
  const inventory = {};
  for (const name in namespace) {
    const iface = namespace[name];
    const methods = {};
    inventory[name] = methods;
    for (const method in iface) {
      const fn = iface[method];
      const signature = parseSignature(fn);
      methods[method] = Object.assign({
        method: name + '.' + method
      }, signature);
    }
  }
  return inventory;
};

module.exports = {
  introspect,
  parseSignature
};
