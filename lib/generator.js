'use strict';

const generateMd = (
  // Generate md from interfaces inventory
  inventory // hash of hash of record, { method, title, parameters }
  // Returns: string, md document
) => {
  const buf = [];
  let name, methods, method, signature, keys, parameter, comment, s;
  for (name in inventory) {
    methods = inventory[name];
    buf.push('## Interface: ' + name + '\n');
    for (method in methods) {
      signature = methods[method];
      buf.push('### ' + signature.title);
      keys = signature.parameters.map(p => p.name);
      buf.push('`' + signature.method + '(' + keys.join(', ') + ')`');
      for (parameter of signature.parameters) {
        buf.push(
          '- `' + parameter.name +
          (parameter.type ? ':' + parameter.type : '') + '`' +
          (parameter.comment ? ' - ' + parameter.comment : '')
        );
      }
      buf.push('');
      for (comment of signature.comments) {
        s = comment.rest;
        if (comment.name === 'Example') s = '`' + s + '`';
        buf.push(comment.name + ': ' + s + '\n');
      }
      buf.push('');
    }
  }
  return buf.join('\n');
};

module.exports = {
  generateMd
};
