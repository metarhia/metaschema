'use strict';

const FUNC_TERMS = [') {', ') => {', ') => ('];

const indexing = s => term => s.indexOf(term);

const parseSignature = (
  // Parse function signature
  fn // string, interface name
  // Returns: { title, parameters }
) => {
  let title;
  let parameters = [];
  let s = fn.toString();
  let pos = FUNC_TERMS.map(indexing(s))
    .filter(k => k !== -1)
    .reduce((prev, cur) => (prev < cur ? prev : cur), s.length);
  if (pos !== -1) {
    s = s.substring(0, pos);
    pos = s.indexOf('\n');
    s = s.substring(pos + 1);
    parameters = s.split('\n');
    parameters.pop();
    title = parameters.shift() || '';
    title = title.replace('//', '').trim();
    parameters = parameters.map(s => s.trim())
      .map(s => s.replace(/^\/\/ /, ''))
      .map(s => s.replace(/^(.*) \/\//, '$1:'))
      .map(s => s.replace(',:', ':'));
  }
  return { title, parameters };
};

const introspect = (
  // Introspect interface
  namespace // hash of interfaces
  // Returns: hash of hash of { method, title, parameters }
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
