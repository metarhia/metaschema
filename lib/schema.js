'use strict';

const { getProcessOrder } = require('./utils');

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

  // Validates an instance of a given type against a schema
  //   type <string>
  //   schema <Schema> | <string> schema or path, that can be resolved by
  //       config.resolve
  //   instance <any>
  //   options <Object>
  // Returns: <Error[]>
  validate(type, schema, instance, options) {
    if (typeof schema === 'string') {
      schema = this.config.resolve(this, type, schema);
    }
    const validator = this.config.processors[type].validator;
    if (!validator) {
      throw new TypeError(`No validator defined for type: '${type}'`);
    }
    return validator(this, schema, instance, options);
  }

  // Creates an instance of given schema
  //   type <string>
  //   schema <Schema> | <string> schema or path, that can be resolved by
  //       config.resolve
  //   instance <any>
  //   options <Object>
  // Returns:
  //   <Error[]>
  //   <any>
  create(type, schema, args, options) {
    if (typeof schema === 'string') {
      schema = this.config.resolve(this, type, schema);
    }
    const creator = this.config.processors[type].creator;
    if (!creator) {
      throw new TypeError(`No creator defined for type: '${type}'`);
    }
    return creator(this, schema, args, options);
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

    schemas.sort(getProcessOrder(this.config.processOrder));
    for (const schema of schemas) {
      const { type } = schema;
      const processors = this.config.processors[type];

      if (processors.preprocess) {
        for (const preprocessor of processors.preprocess) {
          errors.push(...preprocessor(schema));
        }
      }
      if (processors.validate) {
        for (const validator of processors.validate) {
          errors.push(...validator(schema));
        }
      }

      for (const add of processors.add) {
        errors.push(...add(schema, this));
      }
    }

    if (errors.length) {
      return errors;
    }
    this.schemas.push(...schemas);

    for (const schema of schemas) {
      const { type } = schema;
      const processors = this.config.processors[type];
      if (processors.postprocess) {
        for (const postprocessor of processors.postprocess) {
          errors.push(...postprocessor(schema, this));
        }
      }
    }

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
  //     prepare <Function>
  //       ms - <Metaschema>
  //     resolve <Function>
  //       ms - <Metaschema>
  //       path - <string>
  //       Returns: <Schema>
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
  //         validator <Function>, optional
  //           ms <Metaschema>
  //           schema <Schema>
  //           instance <any>
  //           options <Object>
  //           Returns: <Error[]>
  //         creator <Function>, optional
  //           ms <Metaschema>
  //           schema <Schema>
  //           args <any>
  //           options <Object>
  //           Returns:
  //             <Error[]>
  //             <any>
  //     processOrder: <Function> | <Object>, function is passed to
  //         Array.prototype.sort (a: <Schema>, b: <Schema>) => <number>.
  //         If <Object> is provided it would be used as
  //         map from schema type (<string>) to order value (<number>),
  //         types with lower values are processed earlier.
  // Returns: [<Error[]>, <Metaschema>]
  static create(schemas, config) {
    const ms = new Metaschema(config);
    if (config.prepare) {
      config.prepare(ms);
    }
    return [ms.addSchemas(schemas), ms];
  }
}

module.exports = {
  Metaschema,
};
