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
  const { scope = 'local', store = 'memory', allow = 'write', ...rest } = meta;
  const metadata = { kind, scope, store, allow, parent: schemaName, ...rest };
  return { defs, metadata };
};

const kindStored = (kind, meta, root) => {
  const { scope = 'application', store = 'persistent', allow = 'write' } = meta;
  const metadata = { ...meta, kind, scope, store, allow };
  const id = root.name ? `${toLowerCamel(root.name)}Id` : 'id';
  const defs = { [id]: '?string' };
  return { defs, metadata };
};

const kindMemory = (kind, meta) => {
  const { scope = 'local', store = 'memory', allow = 'write' } = meta;
  return { metadata: { ...meta, kind, scope, store, allow }, defs: {} };
};

const getKindMetadata = (kind, meta = {}, root) => {
  if (kind === 'projection') return projection(kind, meta, root);
  if (KIND_MEMORY.includes(kind)) return kindMemory(kind, meta);
  if (KIND_STORED.includes(kind)) return kindStored(kind, meta, root);
  return kindMemory(kind, meta);
};

module.exports = {
  getKindMetadata,
  constants: { KIND, KIND_STORED, KIND_MEMORY, SCOPE, STORE, ALLOW },
};
