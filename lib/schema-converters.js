'use strict';

const { iter } = require('metarhia-common');
const { all: decorators } = require('./decorators');

const defaultOptions = {
  useEsm: false,
};

const createImport = name => `import { ${name} } from 'metaschema';`;
const createRequire = name => `const { ${name} } = require('metaschema');`;

const generateImports = (usedDecorators, useEsm) =>
  `${(useEsm ? createImport : createRequire)('decorators')}\n` +
  `const { ${usedDecorators.join(', ')} } = decorators;`;

const toJs = (source, options = {}) => {
  const { useEsm } = Object.assign({}, defaultOptions, options);
  const usedDecorators = iter(Object.keys(decorators))
    .filter(name => source.match(`\\b${name}\\s*\\(`))
    .toArray();
  return (usedDecorators.length > 0 ?
    generateImports(usedDecorators, useEsm) + '\n\n' : '') +
    `${useEsm ? 'export default' : 'module.exports ='} api => ${source};`;
};


module.exports = {
  toJs,
};
