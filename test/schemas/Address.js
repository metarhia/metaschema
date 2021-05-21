({
  Entity: {},

  city: 'string',
  street: '?string',
  building: '?string',

  naturalKey: { unique: ['city', 'street', 'building'] },
});
