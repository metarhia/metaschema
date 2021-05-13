({
  Registry: {},

  login: { type: 'string', unique: true },
  password: 'string',
  blocked: { type: 'boolean', default: false },
  unit: 'Unit',
  roles: { many: 'Role' },

  fullName: {
    givenName: { type: 'string', required: false },
    middleName: { type: 'string', required: false },
    surname: { type: 'string', required: false },
  },

  birth: {
    birthDate: { type: 'string', required: false },
    birthPlace: { type: 'string', required: false },
  },

  address: {
    country: { type: 'Country', required: false },
    province: { type: 'Province', required: false },
    city: { type: 'City', required: false },
    address1: { type: 'string', required: false },
    address2: { type: 'string', required: false },
    zipCode: { type: 'string', required: false },
  },
});
