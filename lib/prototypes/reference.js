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
      if (!schema) return `Entity "${one}" is not found`;
      return schema.check(source, path);
    }
    const schema = root.findReference(many);
    if (!schema) return `Entity "${many}" is not found`;
    for (const record of source) {
      const result = schema.check(record, path);
      if (!result.valid) return result;
    }
    return null;
  },
};

module.exports = { reference };
