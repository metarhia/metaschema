'use strict';

// Generate md from interfaces inventory
//   inventory - hash of hash of record, { method, title, parameters }
// Returns: string, md document
const generateMd = inventory => {
  const buf = [];
  for (const name in inventory) {
    const methods = inventory[name];
    buf.push('## Interface: ' + name + '\n');
    for (const method in methods) {
      const signature = methods[method];
      buf.push('### ' + signature.title);
      const keys = signature.parameters.map(p => p.name);
      buf.push('`' + signature.method + '(' + keys.join(', ') + ')`');
      buf.push(signature.description);
      for (const parameter of signature.parameters) {
        buf.push(
          '- `' + parameter.name +
          (parameter.type ? ':' + parameter.type : '') + '`' +
          (parameter.comment ? ' - ' + parameter.comment : '')
        );
      }
      buf.push('');
      for (const comment of signature.comments) {
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
