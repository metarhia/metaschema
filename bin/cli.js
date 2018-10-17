#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const common = require('metarhia-common');

const metaschema = require('..');

const cwd = process.cwd();
const apiFile = path.resolve(cwd, process.argv[2]);

try {
  const imports = require(apiFile);
  const namespace = path.basename(apiFile, '.js');
  const inventory = metaschema.introspect({ [namespace]: imports });
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
