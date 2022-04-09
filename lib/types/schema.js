'use strict';

const schema = {
  name: 'schema',
  kind: 'struct',
  check(value, path, def) {
    return def.schema.check(value, path).errors;
  },
  toLong(def, Schema, parent) {
    const { namespaces } = parent;
    const { name } = this;
    const exist = Schema.extractSchema(def);
    if (exist) return { type: name, schema: exist };
    const target = def.schema ? def.schema : def;
    const schema = Schema.from(target, namespaces);
    parent.references = new Set([...parent.references, ...schema.references]);
    parent.relations = new Set([...parent.relations, ...schema.relations]);
    return { type: name, schema };
  },
};

module.exports = { schema };
