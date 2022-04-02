// 'use strict';
// const metatests = require('metatests');
// const { Schema } = require('..');
// metatests.test('Schema: optional shorthand key', (test) => {
//   const defs1 = { 'array?': 'string' };
//   const defs2 = { 'object?': { string: 'string' } };
//   const defs3 = { 'set?': 'string' };
//   const defs4 = { 'map?': { string: 'string' } };

//   const sch1 = Schema.from(defs1);
//   const sch2 = Schema.from(defs2);
//   const sch3 = Schema.from(defs3);
//   const sch4 = Schema.from(defs4);
//   console.dir({ sch1 }, { depth: 40 });
//   console.dir({ sch2 }, { depth: 40 });
//   console.dir({ sch3 }, { depth: 40 });
//   console.dir({ sch4 }, { depth: 40 });

//   test.strictSame(sch1.check([]).valid, true);
//   test.strictSame(sch2.check({}).valid, true);
//   test.strictSame(sch3.check(new Set()).valid, true);
//   test.strictSame(sch4.check(new Map()).valid, true);

//   test.end();
// });
