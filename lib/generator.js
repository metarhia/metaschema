'use strict';

const generateMd = (
  // Generate md from interfaces inventory
  inventory // hash of hash of { method, title, parameters }
  // Returns: string, md document
) => {
  const buf = [];
  let name, methods, method, signature;
  for (name in inventory) {
    methods = inventory[name];
    buf.push('## Interface: ' + name + '\n');
    for (method in methods) {
      signature = methods[method];
      buf.push('### ' + signature.title);
      buf.push('`' + signature.method + '`');
      buf.push('- ' + signature.parameters.join('\n- ') + '\n');
    }
  }
  return buf.join('\n');
};

module.exports = {
  generateMd
};
