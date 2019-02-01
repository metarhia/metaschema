'use strict';

const { load } = require('./src/fs-loader');
const { options, config } = require('./src/config');

(async () => {
  try {
    const [errors, ms] = await load(
      'test/schemas/new',
      options,
      config
    );

    console.log(errors, ms);
  } catch (error) {
    console.error(error);
  }
})();
