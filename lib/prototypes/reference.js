'use strict';

const reference = {
  kind: 'struct',

  construct(def) {
    const { many, one } = def;
    const key = many ? 'many' : 'one';
    const reference = one || many;
    const relation = def.many ? 'many-to-one' : 'one-to-many';
    this[key] = reference;
    this.type = reference;
    this.root.relations.add({ to: reference, type: relation });
  },

  checkType(source, path) {
    const { one, many, root } = this;
    if (one) {
      const schema = root.findReference(one);
      return schema.check(source, path);
    }
    const schema = root.findReference(many);
    for (const obj of source) {
      const res = schema.check(obj, path);
      if (!res.valid) return res;
    }
    return null;
  },
};

module.exports = { reference };
