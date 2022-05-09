'use strict';

const schema = {
  type: 'schema',
  kind: 'struct',
  check(src, path) {
    if (!this.required && !src) return [];
    return this.schema.check(src, path).errors;
  },
  from(src, prep) {
    const { schema } = src;
    const defs = schema || src;
    this.required = src.required || true;
    this.schema = this.isSchema(defs) ? defs : prep.Schema.from(defs);
    this.metadataFrom(this.schema);
  },
  isSchema(src) {
    return src && src.constructor.name === 'Schema';
  },
};

module.exports = { schema };
