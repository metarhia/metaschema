'use strict';

const metaschema = require('..');

metaschema.load('geometry', (err, schema) => {
  if (err) throw err;
  const geometry = metaschema.build(schema);
  console.dir({ geometry });

  const p1 = metaschema.create('Point', { x: 3, y: 5 });
  console.dir({ p1 });

  const p2 = geometry.Point({ x: 3, y: 5 });
  console.dir({ p2 });

  const p3 = geometry.Point([3, 5]);
  console.dir({ p3 });

  const p4 = geometry.Point(3, 5);
  console.dir({ p4 });

  const p5 = geometry.Point({ x: 'hello', y: 2 });
  console.dir({ p5 });

  const p6 = geometry.Point({ name: 'Marcus' });
  console.dir({ p6 });
});
