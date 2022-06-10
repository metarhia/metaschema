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

const projection = (name, meta, root) => {
  const metadata = {
    ...meta,
    kind: name,
    scope: meta.scope || 'local',
    store: meta.store || 'memory',
    allow: meta.allow || 'write',
  };
  const { schema, fields } = meta;
  if (!schema && !fields) throw new Error('Invalid Projection');
  metadata.parent = schema;
  const parent = root.findReference(schema);
  const defs = {};
  for (const key of fields) {
    defs[key] = parent.fields[key];
  }
  return { defs, metadata };
};

const kindStored = (name, meta, root) => {
  const metadata = {
    ...meta,
    kind: name,
    scope: meta.scope || 'application',
    store: meta.store || 'persistent',
    allow: meta.allow || 'write',
  };
  const id = root.name ? `${toLowerCamel(root.name)}Id` : 'id';
  const defs = { [id]: '?string' };
  return { defs, metadata };
};

const kindMemory = (name, meta) => ({
  metadata: {
    ...meta,
    kind: name,
    scope: meta.scope || 'local',
    store: meta.store || 'memory',
    allow: meta.allow || 'write',
  },
});

const getKindMetadata = (name, meta = {}, root) => {
  if (name === 'projection') return projection(name, meta, root);
  if (KIND_MEMORY.includes(name)) return kindMemory(name, meta);
  if (KIND_STORED.includes(name)) return kindStored(name, meta, root);
  return kindMemory(name, meta);
};

module.exports = {
  getKindMetadata,
  KIND,
  KIND_STORED,
  KIND_MEMORY,
  SCOPE,
  STORE,
  ALLOW,
};
