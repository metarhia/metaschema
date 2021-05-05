({
  SystemUser: 'system entity',

  login: { type: 'string', unique: true, length: 30 },
  password: { type: 'string', length: { min: 10 } },

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
