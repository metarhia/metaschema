'use strict';

const { SchemaValidationError } = require('./schema-errors');

const REFERENCE_TYPES = new Set(['Include', 'Many', 'Master', 'Other']);

// Determines type of a reference by its decorator
//   decorator - <string>
// Returns: <string>
const getReferenceType = decorator =>
  REFERENCE_TYPES.has(decorator) ? decorator : 'Other';

// Extracts schema decorator
//   schema - <Object>
// Returns: <string>
const extractDecorator = schema => {
  const className = schema.constructor.name;
  if (className !== 'Function') {
    return className;
  }

  return Object.getPrototypeOf(schema).name || 'Function';
};

// Extracts category decorator type, any undecorated category
// will be treated as Local.
//   category - <Object>
// Returns: <string>
const getCategoryType = category => {
  const type = extractDecorator(category);
  return type === 'Object' ? 'Local' : type;
};

const extractDefinition = (definition, path, position, ms, info) => {
  const property = path[position];

  if (!definition[property]) {
    throw new SchemaValidationError(
      'unresolvedProperty',
      info.source,
      info.property,
      { property: path.slice(0, position + 1).join('.') }
    );
  }

  if (position === path.length - 1) {
    return definition[property];
  }

  const categoryName = definition[property].category;
  const category = ms.categories.get(categoryName);

  return extractDefinition(category.definition, path, position + 1, ms, info);
};

const extractByPath = (definition, path, ms, info) => {
  const isOuterCategory = path.startsWith('::');
  const propPath = path.split('.');

  if (!isOuterCategory) {
    return extractDefinition(definition, propPath, 0, ms, info);
  }

  const root = propPath[0];
  const categoryName = root.slice(2);
  const category = ms.categories.get(categoryName);

  if (!category) {
    throw new SchemaValidationError(
      'unresolvedCategory',
      info.source,
      info.property,
      { category: root }
    );
  }

  return propPath.length === 1
    ? { category: categoryName, definition: category.definition }
    : extractDefinition(category.definition, propPath, 1, ms, info);
};

module.exports = {
  REFERENCE_TYPES,
  getReferenceType,
  getCategoryType,
  extractDecorator,
  extractByPath,
};
