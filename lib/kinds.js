'use strict';

const { toLowerCamel } = require('metautil');

const KIND_ENT = ['entity', 'registry', 'dictionary'];
const KIND_AUX = ['journal', 'details', 'relation', 'view'];
const KIND_STORED = [...KIND_ENT, ...KIND_AUX];
const KIND_MEMORY = ['struct', 'scalar', 'form', 'projection'];
const KIND = [...KIND_MEMORY, ...KIND_STORED];

const SCOPE = ['application', 'global', 'local'];
const STORE = ['persistent', 'memory'];
const ALLOW = ['write', 'append', 'read'];

const KIND_STORED_DEFAULT_META = {
  scope: 'application',
  store: 'persistent',
  allow: 'write',
};

const KIND_MEMORY_DEFAULT_META = {
  scope: 'local',
  store: 'memory',
  allow: 'write',
};

const withDefaults = (meta, defaults, extra) => {
  const result = { ...meta, ...extra };
  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (result[key] === undefined) result[key] = defaultValue;
  }
  return result;
};

const projection = (kind, meta, root) => {
  const { schema: schemaName, fields: fieldNames } = meta;
  if (!schemaName) throw new Error('Invalid Projection: "schema" expected');
  if (!Array.isArray(fieldNames) || fieldNames.length === 0)
    throw new Error('Invalid Projection: non-empty "fields" array expected');
  if (!root || typeof root.findReference !== 'function')
    throw new Error('Invalid Projection: "root" should satisfy Schema API');
  const defs = {};
  const referencedFields = root.findReference(schemaName)?.fields;
  if (referencedFields) {
    for (const name of fieldNames) defs[name] = referencedFields[name];
  }
  const metadata = withDefaults(meta, KIND_MEMORY_DEFAULT_META, {
    kind,
    parent: schemaName,
  });
  return { defs, metadata };
};

const kindStored = (kind, meta, root) => {
  if (!root) throw new Error('"root" schema expected');
  const id = root.name ? `${toLowerCamel(root.name)}Id` : 'id';
  const defs = { [id]: '?string' };
  const metadata = withDefaults(meta, KIND_STORED_DEFAULT_META, { kind });
  return { defs, metadata };
};

const kindMemory = (kind, meta, root) => {
  if (kind === 'projection') return projection(kind, meta, root);
  const metadata = withDefaults(meta, KIND_MEMORY_DEFAULT_META, { kind });
  return { defs: {}, metadata };
};

const getKindMetadata = (kind, meta = {}, root) => {
  const processKind = KIND_STORED.includes(kind) ? kindStored : kindMemory;
  return processKind(kind, meta, root);
};

module.exports = {
  getKindMetadata,
  constants: { KIND, KIND_STORED, KIND_MEMORY, SCOPE, STORE, ALLOW },
};
