'use strict';

const schema = {
  type: 'schema',
  kind: 'struct',
  check(src, path) {
    if (!this.required && !src) return [];
    return this.schema.check(src, path).errors;
  },
  from(src, pr) {
    const defs = src.schema || src;
    this.required = src.required || true;
    const nss = pr.namespaces;
    this.schema = this.isSchema(defs) ? defs : pr.Schema.from(defs, nss, pr);
    this.updateMetadata(this.schema);
  },
  isSchema(src) {
    return src && src.constructor.name === 'Schema';
  },
};

module.exports = { schema };