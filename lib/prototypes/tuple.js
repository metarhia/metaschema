'use strict';

const tuple = {
  kind: 'struct',

  construct(def, prep) {
    const tuple = def.value || def.tuple;
    this.value = tuple.map((el) => {
      const named = typeof el !== 'string';
      const [name, scalar] = named ? Object.entries(el)[0] : [null, el];
      const { Type, defs } = prep.parse(scalar);
      if (!Type || Type.kind !== 'scalar') {
        throw new TypeError(`Type ${scalar} is not a scalar`);
      }
      const type = new Type(defs, prep);
      if (name) type.name = name;
      return type;
    });
  },

  checkType(src, path) {
    if (!Array.isArray(src)) return `not of expected type: ${this.type}`;
    if (src.length > this.value.length) {
      return 'value length is more then expected in tuple';
    }
    for (let i = 0; i < this.value.length; i++) {
      const scalar = this.value[i];
      const nested = `${path}(${scalar.name || 'item'}${i})`;
      const elem = src[i];
      const res = scalar.check(elem, nested);
      if (!res.valid) return res;
    }
    return null;
  },
};

module.exports = { tuple };
