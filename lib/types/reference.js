'use strict';

const reference = {
  name: 'reference',
  kind: 'struct',
  check(value, path, def, schema) {
    const { one, many, required } = def;
    if (many) {
      const type = schema.findType('array');
      const fakeDef = {
        type: 'array',
        value: {
          type: 'reference',
          one: many,
        },
        required,
      };
      return type.check(value, path, fakeDef, schema);
    }
    const sch = schema.findReference(one);
    return sch.check(value, path).errors;
  },
  toLong(def, Schema, schema) {
    const defs = typeof def === 'string' ? { one: def } : def;
    const key = def.many ? 'many' : 'one';
    const value = defs[key] ? defs[key] : defs.type;
    const relation = key === 'many' ? 'many-to-one' : 'one-to-many';
    schema.references.add(value);
    schema.relations.add({ to: value, type: relation });
    return { type: this.name, [key]: value };
  },
};

module.exports = { reference, many: reference, one: reference };
