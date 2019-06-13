'use strict';

const { parse, parseExpression } = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;

const buildPath = node => {
  if (!node) {
    return [];
  }
  if (node.node.key) {
    return [...buildPath(node.parentPath), node.node.key.name];
  }
  return buildPath(node.parentPath);
};

const getInstance = (path, ins) => {
  for (let i = 0; ins && i < path.length; i++) {
    ins = ins[path[i]];
  }
  return ins;
};

const serializeSchema = (
  schema,
  { exclude = () => null, replace = () => null } = {}
) => {
  const { source, definition, ...result } = schema;
  const isStatement = source.trimLeft().startsWith('{');
  const ast = parse(isStatement ? `(\n${source}\n)` : source);

  traverse(ast, {
    ObjectProperty(path) {
      const pathToNode = buildPath(path).reverse();

      const options = {
        path: pathToNode,
        key: path.node.key.name,
        node: path.node,
        source: generate(path.node.value).code,
        ins: getInstance(pathToNode, definition),
      };

      if (exclude(options)) {
        path.remove();
      } else {
        const replaceStr = replace(options);
        if (replaceStr) {
          path.node.value = parseExpression(replaceStr);
        }
      }
    },
  });

  result.source = generate(ast, { compact: true }).code;
  return result;
};

module.exports = { serializeSchema };
