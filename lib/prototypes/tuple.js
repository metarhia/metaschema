'use strict';

const tuple = {
  type: 'tuple',
  kind: 'struct',
  checkType(src, path) {
    if (!Array.isArray(src)) return `not of expected type: ${this.type}`;
    if (src.length > this.value.length) {
      return 'value length is more then expected in tuple';
    }
    for (let i = 0; i < this.value.length; i++) {
      const scalar = this.value[i];
      const nested = `${path}(${scalar.name || 'item'}${i})`;
      const elem = src[i];
      const err = scalar.check(elem, nested);
      if (err.length > 0) return err;
    }
  },
  construct(def, prep) {
    const tuple = def.value || def.tuple;
    this.value = tuple.map((el) => {
      const named = typeof el !== 'string';
      const [name, scalar] = named ? Object.entries(el)[0] : [null, el];
      const { Type, defs } = prep.parse(scalar);
      if (!Type || Type.prototype.kind !== 'scalar') {
        throw new TypeError(`Type ${scalar} is not a scalar`);
      }
      const type = new Type(defs);
      if (name) type.name = name;
      return type;
    });
  },
};

module.exports = { tuple };
