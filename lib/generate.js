'use strict';

const FUNC_TERMS = [') {', ') => {', ') => ('];

const indexing = s => term => s.indexOf(term);

const generateMd = (namespace, iface) => {
  const buf = [];
  let method, fn, s, pos, lines, title;
  for (method in iface) {
    fn = iface[method];
    s = fn.toString();
    pos = FUNC_TERMS.map(indexing(s))
      .filter(k => k !== -1)
      .reduce((prev, cur) => (prev < cur ? prev : cur), s.length);
    if (pos !== -1) {
      s = s.substring(0, pos);
      pos = s.indexOf('\n');
      s = s.substring(pos + 1);
      lines = s.split('\n');
      lines.pop();
      title = lines.shift() || '';
      lines = lines.map(s => s.trim())
        .map(s => s.replace(/^\/\/ /, ''))
        .map(s => s.replace(/^(.*) \/\//, '`$1` -'))
        .map(s => (s.length === 0 ? '' : '- ') + s);
      s = lines.join('\n');
      buf.push(title.trim().replace('//', '##'));
      buf.push('`' + namespace + '.' + method + '`');
      buf.push(s + '\n');
    }
  }
  return buf.join('\n');
};

module.exports = generateMd;
