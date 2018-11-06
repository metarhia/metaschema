'use strict';

const metatests = require('metatests');
const { convert: { toJs } } = require('../metaschema');

const simpleSchema = `
{
  FirstName: { domain: 'Nomen', required: true },
  MiddleName: { domain: 'Nomen' },
}
`;

const decoratedSchema = `
{
  FullName: Include('FullName'),
  Sex: { domain: 'Sex' },
  Languages: Many('Language'),
}
`;

const allDecoratedSchema = `
Local({
  FullName: Include('FullName'),
  Sex: { domain: 'Sex' },
  Languages: Many('Language'),
})
`;

metatests.testSync('toJs test', test => {
  test.testSync('must convert simple schema', t => {
    const expected = `module.exports = api => ${simpleSchema};`;
    t.strictSame(toJs(simpleSchema), expected);
  });

  test.testSync('must convert simple schema (esm)', t => {
    const expected = `export default api => ${simpleSchema};`;
    t.strictSame(toJs(simpleSchema, { useEsm: true }), expected);
  });

  test.testSync('must convert decorated schema', t => {
    const expected =
    `const { decorators } = require('metaschema');
const { Many, Include } = decorators;

module.exports = api => ${decoratedSchema};`;
    t.strictSame(toJs(decoratedSchema), expected);
  });

  test.testSync('must convert decorated schema (esm)', t => {
    const expected =
    `import { decorators } from 'metaschema';
const { Many, Include } = decorators;

export default api => ${decoratedSchema};`;
    t.strictSame(toJs(decoratedSchema, { useEsm: true }), expected);
  });

  test.testSync('must convert all decorated schema', t => {
    const expected =
    `const { decorators } = require('metaschema');
const { Local, Many, Include } = decorators;

module.exports = api => ${allDecoratedSchema};`;
    t.strictSame(toJs(allDecoratedSchema), expected);
  });
});
