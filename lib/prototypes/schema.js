'use strict';

const { isInstanceOf } = require('metautil');

const { Struct } = require('../struct.js');

const schema = {
  kind: 'struct',

  construct(defs, prep) {
    const { schema, required } = defs;
    this.required = required || true;
    const isStruct = isInstanceOf(schema, 'Struct');
    if (isStruct) this.schema = schema;
    else this.schema = new Struct(schema, prep);
    this.validate = defs.schema.validate || undefined;
  },

  checkType(source, path = '') {
    return this.schema.check(source, path);
  },
};

module.exports = { schema };
