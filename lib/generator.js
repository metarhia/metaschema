'use strict';

const generateMd = (
  // Generate md from interfaces inventory
  inventory // hash of hash of record, { method, title, parameters }
  // Returns: string, md document
) => {
  const buf = [];
  let name, methods, method, signature, keys, parameter, comment;
  for (name in inventory) {
    methods = inventory[name];
    buf.push('## Interface: ' + name + '\n');
    for (method in methods) {
      signature = methods[method];
      buf.push('### ' + signature.title);
      keys = signature.parameters.map(p => p.name);
      buf.push('`' + signature.method + '(' + keys.join(', ') + ')`');
      buf.push(signature.description);
      for (parameter of signature.parameters) {
        buf.push(
          '- `' + parameter.name +
          (parameter.type ? ':' + parameter.type : '') + '`' +
          (parameter.comment ? ' - ' + parameter.comment : '')
        );
      }
      buf.push('');
      for (comment of signature.comments) {
        if (comment.name === 'Example') {
          buf.push('`' + comment.name + ': ' + comment.comment + '`\n');
        } else {
          buf.push(comment.name + ': ' + comment.comment + '\n');
        }
      }
      buf.push('');
    }
  }
  return buf.join('\n');
};

module.exports = { generateMd };
