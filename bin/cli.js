#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const common = require('@metarhia/common');

const metaschema = require('..');

const apiFile = path.resolve(process.argv[2]);

try {
  const imports = require(apiFile);
  const namespace = path.basename(apiFile, '.js');
  let data = '';
  for (const module in require.cache) {
    if (!module.includes('node_modules') &&
      module !== __filename &&
      fs.existsSync(module) && common.fileExt(module) !== 'node') {
      data += fs.readFileSync(module, 'utf8') + '\n';
    }
  }

  const inventory = metaschema.introspect(
    new Map([[namespace, imports]]), data
  );
  const md = metaschema.generateMd(inventory);
  const mdFile = common.removeExt(apiFile) + '.md';

  fs.writeFile(mdFile, md, err => {
    if (err) console.log('Cant save output: ' + mdFile);
    else console.log('Generated API docs: ' + mdFile);
  });
} catch (e) {
  console.log('Cant read file: ' + apiFile);
  console.log(e);
}
