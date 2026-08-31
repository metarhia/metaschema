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
  const { scope = 'local', store = 'memory', allow = 'write' } = meta;
  const { schema, fields } = meta;
  if (!schema && !fields) throw new Error('Invalid Projection');
  const parent = schema;
  const metadata = { ...meta, kind, scope, store, allow, parent };
  const entity = root.findReference(schema);
  const defs = {};
  for (const key of fields) {
    defs[key] = entity.fields[key];
  }
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
  const metadata = { ...meta, kind, scope, store, allow };
  const defs = {};
  return { defs, metadata };
};

const getKindMetadata = (kind, meta = {}, root) => {
  if (kind === 'projection') return projection(kind, meta, root);
  if (KIND_MEMORY.includes(kind)) return kindMemory(kind, meta);
  if (KIND_STORED.includes(kind)) return kindStored(kind, meta, root);
  return kindMemory(kind, meta);
};

const constants = { KIND, KIND_STORED, KIND_MEMORY, SCOPE, STORE, ALLOW };

module.exports = { constants, getKindMetadata };
