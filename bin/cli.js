#!/usr/bin/env node
'use strict';

const fs = require('fs');

const common = require('metarhia-common');

const metaschema = require('..');

const apiFile = process.argv[2];
try {
  const imports = require(apiFile);
  const md = metaschema.generate('api.interfaceName', imports);
  const mdFile = common.removeExt(apiFile) + '.md';

  fs.writeFile(mdFile, md, (err) => {
    if (err) console.log('Cant save output: ' + mdFile);
    else console.log('Generated API docs: ' + mdFile);
  });
} catch (e) {
  console.log('Cant read file: ' + apiFile);
}
