({
  ip: 'inet',
  decimal: {
    js: 'decimal',
    pg: 'decimal',
    nums: '1234567890e',
    kind: 'scalar',
    check(value, path, def) {
      if (typeof value !== 'string') {
        return [`Field "${path}" not a decimal 1`];
      }
      const { length } = def;
      if (length) {
        const err = this.checkLength(value, path, length);
        if (err) return err;
      }
      const arr = value.split('.');
      if (arr.length !== 2) return [`Field "${path}" not a decimal 2`];
      const [a, b] = arr;
      const chars = new Set([...a, ...b]);
      for (const char of chars) {
        if (!this.nums.includes(char))
          return [`Field "${path}" not a decimal 3`];
      }
      return [];
    },
    toLong(def) {
      const { length } = def;
      if (length) def.length = this.formatLength(length);
      return def;
    },
    formatLength(length) {
      if (typeof length === 'number') return { max: length };
      if (Array.isArray(length)) return { min: length[0], max: length[1] };
      return length;
    },
    checkLength(value, path, length) {
      const len = value.length;
      const { min, max } = length;
      if (min && len < min) return [`Field "${path}" value is too short`];
      if (max && len > max) {
        return [`Field "${path}" exceeds the maximum length`];
      }
    },
  },
});
