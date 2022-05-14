'use strict';

const reference = {
  kind: 'struct',
  checkType(source, path, root) {
    const { one, many } = this;
    if (one) {
      const schema = root.findReference(one);
      return schema.check(source, path).errors;
    }
    const schema = root.findReference(many);
    for (const obj of source) {
      const { valid, errors } = schema.check(obj, path);
      if (!valid) return errors;
    }
  },
  construct(def) {
    const reference = def.one || def.many;
    const relation = def.many ? 'many-to-one' : 'one-to-many';
    this.type = reference;
    this.references.add(reference);
    this.relations.add({ to: reference, type: relation });
  },
};

module.exports = { reference };
