({
  Address: 'system registry',

  city: 'City',
  street: 'string',
  building: 'string',
  apartment: 'string',

  naturalKey: { primary: ['city', 'street', 'building', 'apartment'] },
});
