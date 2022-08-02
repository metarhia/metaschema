type Scope = 'global' | 'system' | 'local' | 'memory';

type Allow = 'read' | 'write' | 'append';

type Kind =
  | 'dictionary'
  | 'registry'
  | 'entity'
  | 'details'
  | 'relation'
  | 'form'
  | 'view'
  | 'projection'
  | 'journal'
  | 'struct'
  | 'scalar';

type Cardinality =
  | 'one-to-one'
  | 'one-to-many'
  | 'many-to-one'
  | 'many-to-many';

interface Relation {
  to: string;
  type: Cardinality;
}

interface SchemaError {
  valid: boolean;
  errors: string[];
}

export class Schema {
  static KIND: Array<string>;
  static KIND_STORED: Array<string>;
  static KIND_MEMORY: Array<string>;
  static SCOPE: Array<string>;
  static STORE: Array<string>;
  static ALLOW: Array<string>;

  static from(raw: object, namespaces?: Array<Model>): Schema;
  static extractSchema(def: object): Schema | null;

  root: null;
  kind: Kind;
  references: Set<string>;
  relations: Set<Relation>;
  scope: Scope;
  allow: Allow;
  parent: string;
  indexes: object;
  options: {
    validate: Function | null;
    format: Function | null;
    parse: Function | null;
    serialize: Function | null;
  };
  custom: object;
  fields: object;
  name: string;
  namespaces: Set<Model>;

  constructor(name: string, raw: object, namespaces?: Array<Model>);
  get types(): object;
  checkConsistency(): Array<string>;
  findReference(name: string): Schema;
  check(value: any): SchemaError;
  toInterface(): string;
  attach(...namespaces: Array<Model>): void;
  detouch(...namespaces: Array<Model>): void;
  toString(): string;
  toJSON(): object;
  validate(value: any, path: string): SchemaError;
}

export function createSchema(name: string, src: string): Schema;
export function loadSchema(fileName: string): Promise<Schema>;
export function readDirectory(dirPath: string): Promise<Map<string, object>>;
export function loadModel(
  modelPath: string,
  systemTypes: object,
): Promise<Model>;
export function saveTypes(outputFile: string, model: Model): Promise<void>;

export class Model {
  types: object;
  entities: Map<string, object>;
  database: object;
  order: Set<string>;
  warnings: Array<string>;

  constructor(types: object, entities: Map<string, object>, database?: object);
  preprocess(): void;
  reorderEntity(name: string, base?: string): void;
  get dts(): string;
}
