({
  SystemGroup: 'system entity',

  name: { type: 'string', unique: true },
  users: { many: 'SystemUser' },
});
