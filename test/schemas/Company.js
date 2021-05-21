({
  Registry: {},

  name: { type: 'string', unique: true },
  parent: { type: 'Company', required: false },
});
