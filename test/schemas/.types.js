({
  ip: {
    js: 'string',
    pg: 'inet',
  },
  decimal: {
    pg: 'decimal',
    kind: 'scalar',
    rules: ['length'],
    symbols: '1234567890e.',
    validate(src, path) {
      if (typeof src !== 'string') {
        return `Field "${path}" not a decimal 1`;
      }
      const arr = src.split('.');
      if (arr.length !== 2) return `Field "${path}" not a decimal 2`;
      const [a, b] = arr;
      const chars = new Set([...a, ...b]);
      for (const char of chars) {
        if (!this.symbols.includes(char))
          return `Field "${path}" not a decimal 3`;
      }
    },
    format() {},
  },
});
