'use strict';

const { isInstanceOf } = require('../util.js');
const { Struct } = require('../struct.js');

const schema = {
  kind: 'struct',

  construct(defs, prep) {
    const { schema, required } = defs;
    this.required = required || true;
    const isStruct = isInstanceOf(schema, 'Struct');
    this.schema = isStruct ? schema : new Struct(schema, prep);
    this.validate = defs.schema.validate || undefined;
  },

  checkType(source, path = '', isPartial) {
    const method = isPartial ? 'partialCheck' : 'check';
    return this.schema[method](source, path);
  },
};

module.exports = { schema };
