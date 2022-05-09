'use strict';

const KIND_ENT = ['entity', 'registry', 'dictionary'];
const KIND_AUX = ['journal', 'details', 'relation', 'view'];
const KIND_STORED = [...KIND_ENT, ...KIND_AUX];
const KIND_MEMORY = ['struct', 'scalar', 'form', 'projection'];

const SCOPE = ['application', 'global', 'local'];
const STORE = ['persistent', 'memory'];
const ALLOW = ['write', 'append', 'read'];

const projection = (meta = {}, root) => {
  const metadata = {
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

const kindStored = (meta = {}) => ({
  metadata: {
    scope: meta.scope || 'application',
    store: meta.store || 'persistent',
    allow: meta.allow || 'write',
  },
});

const kindMemory = (meta = {}) => ({
  metadata: {
    scope: meta.scope || 'local',
    store: meta.store || 'memory',
    allow: meta.allow || 'write',
  },
});

const KIND = {
  registry: kindStored,
  entity: kindStored,
  dictionary: kindStored,
  relation: kindStored,
  journal: kindStored,
  details: kindStored,
  view: kindStored,

  struct: kindMemory,
  scalar: kindMemory,
  form: kindMemory,
  projection,
};

module.exports = { KIND, KIND_STORED, KIND_MEMORY, SCOPE, STORE, ALLOW };
