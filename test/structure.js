'use strict';

const path = require('path');
const metatests = require('metatests');
const metaschema = require('..');

const geometryTest = metatests.test('geometry');
const geometryPath = path.join(__dirname, '..', 'schemas', 'geometry');
metaschema.fs.loadAndCreate(geometryPath, null, (err, ms) => {
  geometryTest.error(err);

  metatests.case(
    'Metaschema / structure',
    {
      createInstance: ms.createInstance.bind(ms),
      buildCategory: ms.buildCategory.bind(ms),
    },
    {
      createInstance: [
        ['Point', { x: 3, y: 5 }, { x: 3, y: 5 }],
        ['Point', { x: 3, y: 5 }, { x: 3, y: 5 }],
        ['Point', [3, 5], { x: 3, y: 5 }],
        ['Point', { x: 'hello', y: 2 }, null],
        ['Point', { name: 'Marcus' }, null],
        ['Line', [[1, 3], [2, 5]], { a: { x: 1, y: 3 }, b: { x: 2, y: 5 } }],
        /*[
        'Polyline', {
          points: [
            { x: 1, y: 3 },
            { x: 2, y: 2 },
            { x: 3, y: 4 },
            { x: 4, y: 5 },
            { x: 3, y: 5 },
          ],
        }, {
          points: [
            { x: 1, y: 3 },
            { x: 2, y: 2 },
            { x: 3, y: 4 },
            { x: 4, y: 5 },
            { x: 3, y: 5 },
          ],
        },
      ],
      */
      ],
      buildCategory: [
        ['Point', 3, 5, { x: 3, y: 5 }],
        [
          'Line',
          { x: 1, y: 3 },
          { x: 2, y: 5 },
          { a: { x: 1, y: 3 }, b: { x: 2, y: 5 } },
        ],
        ['Line', [1, 3], [2, 5], { a: { x: 1, y: 3 }, b: { x: 2, y: 5 } }],
        ['Line', { name: 'Marcus' }, { x: 2, y: true }, null],
        ['Circle', { x: 1, y: 3 }, 10, { center: { x: 1, y: 3 }, radius: 10 }],
      ],
    }
  );

  geometryTest.end();
});
