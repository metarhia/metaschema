'use strict';

const { getProcessOrder } = require('./utils');
const { MetaschemaError } = require('./errors');

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
  // Returns: <Error> | <null>
  validate(type, schema, instance, options) {
    if (!this.config.processors[type]) {
      throw new TypeError(`No processors defined for type: '${type}'`);
    }
    if (typeof schema === 'string') {
      schema = this.config.resolve(this, type, schema);
    }
    const validator = this.config.processors[type].validateInstance;
    if (!validator) {
      throw new TypeError(`No validator defined for type: '${type}'`);
    }
    const errors = validator(this, schema, instance, options);
    return errors.length === 0 ? null : new MetaschemaError(errors);
  }

  // Creates an instance of given schema
  //   type <string>
  //   schema <Schema> | <string> schema or path, that can be resolved by
  //       config.resolve
  //   instance <any>
  //   options <Object>
  // Returns: <any>
  create(type, schema, args, options) {
    if (!this.config.processors[type]) {
      throw new TypeError(`No processors defined for type: '${type}'`);
    }
    if (typeof schema === 'string') {
      schema = this.config.resolve(this, type, schema);
    }
    const creator = this.config.processors[type].creator;
    if (!creator) {
      throw new TypeError(`No creator defined for type: '${type}'`);
    }
    const [errors, result] = creator(this, schema, args, options);
    if (errors.length !== 0) throw new MetaschemaError(errors);
    return result;
  }

  // Adds multiple schemas
  //   schemas <Schema> | <Schema[]>
  addSchemas(schemas) {
    const errors = [];
    if (!Array.isArray(schemas)) schemas = [schemas];

    schemas.sort(getProcessOrder(this.config.processOrder));
    for (const schema of schemas) {
      const { type } = schema;
      const processors = this.config.processors[type];

      if (!processors) {
        throw new TypeError(`No processors defined for type: '${type}'`);
      }

      if (processors.preprocess) {
        for (const preprocessor of processors.preprocess) {
          errors.push(...preprocessor(schema));
        }
      }
      if (processors.validateSchema) {
        for (const validator of processors.validateSchema) {
          errors.push(...validator(schema));
        }
      }

      for (const add of processors.add) {
        errors.push(...add(schema, this));
      }
    }

    if (errors.length !== 0) throw new MetaschemaError(errors);

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

    if (errors.length !== 0) throw new MetaschemaError(errors);
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
  //       ms <Metaschema>
  //     resolve <Function>
  //       ms <Metaschema>
  //       path <string>
  //       Returns: <Schema>
  //     processors <Object>
  //       [type] <Object>
  //         preprocess <Function[]>, optional
  //           schema <Schema>
  //           Returns: <Error[]>
  //         validateSchema <Function[]>, optional
  //           schema <Schema>
  //           Returns <Error[]>
  //         add <Function[]>
  //           schema <Schema>
  //           ms <Metaschema>
  //           Returns <Error[]>
  //         postprocess <Function[]>, optional
  //           schema <Schema>
  //           ms <Metaschema>
  //           Returns: <Error[]>
  //         serialize <Function>, optional
  //           schema <Schema>
  //           ms <Metaschema>
  //           Returns: <string>
  //         validateInstance <Function>, optional
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
  //           Returns: [<Error[]>, <any>]
  //     processOrder: <Function> | <Object>, function is passed to
  //         Array.prototype.sort (a: <Schema>, b: <Schema>) => <number>.
  //         If <Object> is provided it would be used as
  //         map from schema type (<string>) to order value (<number>),
  //         types with lower values are processed earlier.
  // Returns: <Metaschema>
  static create(schemas, config) {
    const ms = new Metaschema(config);
    if (config.prepare) {
      config.prepare(ms);
    }
    ms.addSchemas(schemas);
    return ms;
  }
}

module.exports = {
  Metaschema,
};
