'use strict';

const common = require('metarhia-common');

const FUNC_TERMS = [') {', ') => {', ') => ('];
const FUNC_LINES = ['Example:', 'Returns:'];

const indexing = s => term => s.indexOf(term);

const parseLines = (
  // Parse signature lines
  s, // string, signature lines
  signature // record, { title, parameters, comments }
  // Returns: array of string
) => {
  let lines = s.split('\n');
  lines.pop();
  signature.title = (lines.shift() || '').replace('//', '').trim();
  lines = lines.map(s => s.trim()
    .replace(/^\/\/ /, '')
    .replace(/^(.*) \/\//, '$1:')
    .replace(',:', ':')
  );
  let name, rest, type, comment;
  for (const line of lines) {
    const index = FUNC_LINES.find(s => line.startsWith(s));
    [name, rest] = common.section(line, ':');
    rest = rest.trim();
    if (index) {
      signature.comments.push({ name, rest });
    } else {
      [type, comment] = common.section(rest, ',');
      comment = comment.trim();
      signature.parameters.push({ name, type, comment });
    }
  }
};

const parseSignature = (
  // Parse function signature
  fn // function, method
  // Returns: { title, parameters }
) => {
  const signature = { title: '', parameters: [], comments: [] };
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
  let name, iface, methods, method, fn, signature;
  for (name in namespace) {
    iface = namespace[name];
    methods = {};
    inventory[name] = methods;
    for (method in iface) {
      fn = iface[method];
      signature = parseSignature(fn);
      signature = Object.assign({
        method: name + '.' + method
      }, signature);
      methods[method] = signature;
    }
  }
  return inventory;
};

module.exports = {
  introspect,
  parseSignature
};
