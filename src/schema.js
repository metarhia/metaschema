'use strict';

class Metaschema {
  constructor(config) {
    this.config = config;
    this.schemas = [];
  }

  // Generates sources in a format eligible for recreating schema
  // Returns: <Object[]>
  //   type <string>
  //   module <string>
  //   name <string>
  //   source <string>
  get sources() {
    return this.schemas.map(schema => ({
      type: schema.type,
      module: schema.module,
      name: schema.name,
      source: schema.source,
    }));
  }

  // Adds a schema
  //   schema - <Schema>
  // Returns: <Error[]>
  add(schema) {
    const processors = this.config.processors[schema.type];
    const errors = [];

    if (processors.preprocess) {
      errors.push(...processors.preprocess(schema));
    }
    if (processors.validate) {
      errors.push(...processors.validate(schema));
    }
    processors.add(schema, this);
    this.schemas.push(schema);
    if (processors.postprocess) {
      errors.push(processors.postprocess(schema, this));
    }
    return errors;
  }

  // Adds multiple schemas
  //   schemas - <Schema[]>
  // Returns: <Error[]>
  addSchemas(schemas) {
    const errors = [];
    schemas.sort(this.config.order);
    for (const schema of schemas) {
      const { type } = schema;
      const processors = this.config.processors[type];

      if (processors.preprocess) {
        errors.push(...processors.preprocess(schema));
      }
      if (processors.validate) {
        errors.push(...processors.validate(schema));
      }
      processors.add(schema, this);
    }

    if (errors.length) {
      return errors;
    }
    this.schemas.push(...schemas);

    for (const schema of schemas) {
      const { type } = schema;
      const processors = this.config.processors[type];
      if (processors.postprocess) {
        errors.push(processors.postprocess(schema, this));
      }
    }

    // TODO Return MetaschemaError instead of errors
    return errors;
  }

  // Creates Metaschema object and fills it with schemas
  //   schemas <Schema[]>
  //     type <string>
  //     module <string>
  //     name <string>
  //     definition <Object>
  //     source <string>
  //   config <Object>
  //     processors <Object>
  //       [type] <Object>
  //         preprocess: <Function>, optional
  //           schema - <Schema>
  //           Returns: <Error[]>
  //         validate: <Function>, optional
  //           schema - <Schema>
  //           Returns <Error[]>
  //         add <Function>
  //           schema - <Schema>
  //           ms - <Metaschema>
  //           Returns <Error[]>
  //         postprocess <Function>, optional
  //           schema - <Schema>
  //           ms - <Metaschema>
  //           Returns: <Error[]>
  //         serialize <Function>, optional
  //           schema <Schema>
  //           ms <Metaschema>
  //           Returns: <string>
  //     order: <Function>, function to pass to Array.prototype.sort,
  //         to order schemas before processing
  // Returns: [<Error[]>, <Metaschema>]
  static create(schemas, config) {
    const ms = new Metaschema(config);
    return [ms.addSchemas(schemas), ms];
  }
}

module.exports = {
  Metaschema,
};
