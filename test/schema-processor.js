'use strict';

const vm = require('vm');
const metatests = require('metatests');
const { processSchema } = require('../lib/schema-processor');

const processorTest = metatests.testSync('must properly process schema');

const { stack } = processSchema(
  '__SCHEMA_FILE_NAME__',
  `{
  stack: new Error().stack,
}`,
  {},
  vm.runInNewContext
);

processorTest.assert(stack.includes('__SCHEMA_FILE_NAME__'));
