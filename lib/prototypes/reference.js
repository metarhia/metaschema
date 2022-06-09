'use strict';

const reference = {
  kind: 'struct',
  checkType(source, path) {
    const { one, many, metadata } = this;
    if (one) {
      const schema = metadata.root.findReference(one);
      return schema.check(source, path);
    }
    const schema = metadata.root.findReference(many);
    for (const obj of source) {
      const res = schema.check(obj, path);
      if (!res.valid) return res;
    }
  },
  construct(def) {
    const reference = def.one || def.many;
    const relation = def.many ? 'many-to-one' : 'one-to-many';
    this.type = reference;
    this.metadata.references.add(reference);
    this.metadata.relations.add({ to: reference, type: relation });
  },
};

module.exports = { reference };
