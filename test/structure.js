'use strict';

const metatests = require('metatests');
const metaschema = require('..');

const geometryTest = metatests.test('geometry');

metaschema.load('geometry', (err, schema) => {
  geometryTest.error(err);

  const geometry = metaschema.build(schema);

  metatests.case('Metaschema / structure', {
    createInstance: metaschema.createInstance,
    geometry
  }, {
    'createInstance': [
      ['Point', { x: 3, y: 5 }, { x: 3, y: 5 }]
    ],
    'geometry': [
      ['Point', { x: 3, y: 5 },        { x: 3, y: 5 }],
      ['Point', [3, 5],                { x: 3, y: 5 }],
      ['Point', 3, 5,                  { x: 3, y: 5 }],
      ['Point', { x: 'hello', y: 2 },  null],
      ['Point', { name: 'Marcus' },    {}],
      [
        'Line', { x: 1, y: 3 }, { x: 2, y: 5 },
        { a: { x: 1, y: 3 }, b: { x: 2, y: 5 } }
      ], [
        'Line', [[1, 3], [2, 5]],
        { a: { x: 1, y: 3 }, b: { x: 2, y: 5 } }
      ], [
        'Line', [1, 3], [2, 5],
        { a: { x: 1, y: 3 }, b: { x: 2, y: 5 } }
      ], [
        'Line', { name: 'Marcus' }, { x: 2, y: true },
        null
      ], [
        'Circle', { x: 1, y: 3 }, 10,
        { center: { x: 1, y: 3 }, radius: 10 }
      ], [
        'Polyline', {
          points: [
            { x: 1, y: 3 },
            { x: 2, y: 2 },
            { x: 3, y: 4 },
            { x: 4, y: 5 },
            { x: 3, y: 5 }
          ]
        }, {
          points: [
            { x: 1, y: 3 },
            { x: 2, y: 2 },
            { x: 3, y: 4 },
            { x: 4, y: 5 },
            { x: 3, y: 5 }
          ]
        }
      ]
    ]
  });

  geometryTest.end();
});
