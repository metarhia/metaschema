'use strict';

const { runInNewContext } = require('vm');

const metatests = require('metatests');
const metaschema = require('..');

const { serializeSchema } = require('../lib/serialization');
const { options, config } = require('../lib/config');

const decorators = require('../lib/decorators');

const testDomainsSource =
  `({SimpleDomain:{type:'object'},` +
  `CustomEnum:Enum('One','Two'),` +
  `CustomFlags:Flags.of('CustomEnum'),` +
  `Int:{type:'number',subtype:'int',min:10,max:100},` +
  `Double:{type:'number'},` +
  `Text:{type:'string',min:5,length:10},` +
  `StringWithLetterA:{type:'string',check:text=>text.includes('A')},` +
  `CustomUint32Array:{type:'object',class:'Uint32Array',length:10},` +
  `AnyTypeDomain:{type:'any'}});`;

const testCategorySource =
  `({SimpleField:{domain:'SimpleDomain'},` +
  `Date:{type:'object',class:'Date',parse:()=>null,` +
  `check:x=>!Number.isNaN(+x)},NativeFunc:Date.parse});`;

metatests.test('must serialize the schemas correctly', async test => {
  const schema = await metaschema.fs.load(
    'test/schemas/serialization',
    options,
    config
  );

  const domains = schema.schemas[0];
  const stringifyDomains = serializeSchema(domains);

  const category = schema.categories.get('Test');
  const { type, module, name, source } = serializeSchema(category, {
    exclude: ({ ins }) =>
      ins && metaschema.extractDecorator(ins) === 'Validate',
  });

  const stringifyCategory = { type, name, module, source };

  stringifyDomains.definition = metaschema.processSchema(
    'TestDomains',
    stringifyDomains.source,
    { decorators: decorators.functions },
    runInNewContext
  );

  stringifyCategory.definition = metaschema.processSchema(
    'TestCategory',
    stringifyCategory.source,
    {},
    runInNewContext
  );

  test.strictSame(stringifyDomains.source, testDomainsSource);
  test.strictSame(stringifyCategory.source, testCategorySource);

  test.end();
});
