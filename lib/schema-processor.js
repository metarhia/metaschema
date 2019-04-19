'use strict';

const SCRIPT_TIMEOUT = 2000;

// Process schema source
//   name <string> schema name
//   source <string> schema source
//   options <Object>
//     context <Object> object to be assigned to global during loading
//     decorators <Object> decorators available during schema processing
//     localDecorators <Object> type specific decorators available during
//       schema processing
//   evaluator <Function> function to be used to evaluate schema
// Returns: <Object> processed schema
const processSchema = (
  name,
  source,
  { context = null, decorators = null, localDecorators = null },
  evaluator
) => {
  const sandbox = { ...context, ...decorators, ...localDecorators };
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
