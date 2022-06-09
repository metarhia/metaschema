'use strict';

const schema = {
  type: 'schema',
  kind: 'struct',
  check(src, path) {
    if (!this.required && !src) return [];
    return this.schema.check(src, path);
  },
  from(src, pr) {
    const defs = src.schema || src;
    this.required = src.required || true;
    const nss = pr.namespaces;
    const { Schema } = pr;
    this.schema = Schema.isSchema(defs) ? defs : pr.Schema.from(defs, nss, pr);
    this.metadata.updateRefs(this.schema);
  },
};

module.exports = { schema };
