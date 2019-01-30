'use strict';

const { load } = require('./src/fs-loader');
const decorators = require('./lib/decorators');

(async () => {
  try {
    const [errors, ms] = await load(
      'test/schemas/new',
      {
        decorators: decorators.all,
        extToType: {
          category: 'category',
        },
        order: () => 0,
      },
      {
        processors: {
          category: {
            add: (schema, ms) => {
              if (!ms.categories) {
                ms.categories = new Map([[schema.name, schema]]);
              } else {
                ms.categories.set(schema.name, schema);
              }
            },
          },
        },
        order: () => 0,
      }
    );

    console.log(errors, ms);
  } catch (error) {
    console.error(error);
  }
})();
