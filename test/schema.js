'use strict';

const metaschema = require('..');

metaschema.load('geometry', (err, schema) => {
  if (err) throw err;
  const geometry = metaschema.build(schema);

  const p1 = metaschema.create('Point', { x: 3, y: 5 });
  console.dir({ p1 });

  const p2 = geometry('Point', { x: 3, y: 5 });
  console.dir({ p2 });

  const p3 = geometry('Point', [3, 5]);
  console.dir({ p3 });

  const p4 = geometry('Point', 3, 5);
  console.dir({ p4 });

  const p5 = geometry('Point', { x: 'hello', y: 2 });
  console.dir({ p5 });

  const p6 = geometry('Point', { name: 'Marcus' });
  console.dir({ p6 });

  const l1 = geometry('Line', { x: 1, y: 3 }, { x: 2, y: 5 });
  console.dir({ l1 });

  const l2 = geometry('Line', [[1, 3], [2, 5]]);
  console.dir({ l2 });

  const l3 = geometry('Line', [1, 3], [2, 5]);
  console.dir({ l3 });

  const l4 = geometry('Line', { name: 'Marcus' }, { x: 2, y: true });
  console.dir({ l4 });

});
