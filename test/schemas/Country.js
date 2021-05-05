({
  Country: 'global dictionary',

  planet: { type: 'Planet', delete: 'restrict', update: 'cascade' },
  name: { type: 'string', unique: true },
});
