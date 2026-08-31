'use strict';

const tuple = {
  kind: 'struct',

  construct(def, prep) {
    const tuple = def.value || def.tuple;
    this.value = tuple.map((element) => {
      const named = typeof element !== 'string';
      const pair = named ? Object.entries(element)[0] : [null, element];
      const name = pair[0];
      const scalar = pair[1];
      const { Type, defs } = prep.parse(scalar);
      if (!Type || Type.kind !== 'scalar') {
        throw new TypeError(`Type ${scalar} is not a scalar`);
      }
      const type = new Type(defs, prep);
      if (name) type.name = name;
      return type;
    });
  },

  checkType(source, path) {
    if (!Array.isArray(source)) return `not of expected type: ${this.type}`;
    if (source.length > this.value.length) {
      return 'value length is more then expected in tuple';
    }
    for (let index = 0; index < this.value.length; index += 1) {
      const scalar = this.value[index];
      const itemName = scalar.name || 'item';
      const nested = `${path}(${itemName}${index})`;
      const element = source[index];
      const result = scalar.check(element, nested);
      if (!result.valid) return result;
    }
    return null;
  },
};

module.exports = { tuple };
