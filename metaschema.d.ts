type Scope = 'global' | 'system' | 'local' | 'memory';

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

export class Schema {
  name: string;
  namespaces: Set<Model>;
  parent: string;
  scope: Scope;
  kind: Kind;
  fields: object;
  indexes: object;
  references: Set<string>;
  relations: Set<Relation>;
  validate: Function | null;
  format: Function | null;
  parse: Function | null;
  serialize: Function | null;

  constructor(name: string, raw: object, namespaces?: Array<Model>);
  preprocess(defs: object): void;
  preprocessIndex(key: string, def: object): object;
  checkConsistency(): Array<string>;
  static from(raw: object, namespaces?: Array<Model>): Schema;
  check(value: any): { valid: boolean; errors: Array<string> };
  attach(...namespaces: Array<Model>): void;
  detouch(...namespaces: Array<Model>): void;

  static KIND: Array<string>;
  static KIND_STORED: Array<string>;
  static KIND_MEMORY: Array<string>;
  static SCOPE: Array<string>;
  static STORE: Array<string>;
  static ALLOW: Array<string>;
}

export function createSchema(name: string, src: string): Schema;
export function loadSchema(fileName: string): Promise<Schema>;
export function readDirectory(dirPath: string): Promise<Map<string, object>>;

export class Model {
  types: object;
  entities: Map<string, object>;
  database: object;
  order: Set<string>;
  warnings: Array<string>;

  constructor(types: object, entities: Map<string, object>, database?: object);
  static load(modelPath: string, systemTypes?: object): Promise<Model>;
  preprocess(): void;
  reorderEntity(name: string, base?: string): void;
  saveTypes(outputFile: string): Promise<void>;
}
