'use strict';

const { all: allDecorators } = require('./decorators');

const SCRIPT_TIMEOUT = 2000;

let vm = null;

// Process schema source
//   name - <string> schema name
//   source - <string> schema source
//   context - <Object> object to be assigned to global during loading
//   evaluator - <Function> function to be used to evaluate schema
//   decorators - <Object> decorators available during schema processing
// Returns: <Object> processed schema
const processSchema = (
  name,
  source,
  context = {},
  evaluator = null,
  decorators = allDecorators
) => {
  if (!evaluator) {
    // In order to natively support browser don't require 'vm' until requested
    if (!vm) vm = require('vm');
    evaluator = vm.runInNewContext;
  }
  const sandbox = { ...context, ...decorators };
  sandbox.global = sandbox;
  source = source.toString().replace(/[\s;]+$/, '');
  const code = `'use strict';\n(${source})`;
  const options = {
    filename: name,
    timeout: SCRIPT_TIMEOUT,
    lineOffset: 1,
  };
  return evaluator(code, sandbox, options);
};

module.exports = {
  processSchema,
};
