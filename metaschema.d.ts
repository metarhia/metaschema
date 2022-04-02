type Constructor<I> = new (...args: any[]) => I;

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

type Scalar = string | number | boolean | bigint;

interface Definition {
  type: string;
  required: boolean;
  schema?: string | Schema;
  value?: Definition;
  key?: Scalar | symbol | object | Function;
  unique?: boolean;
  length?: { min: number; max: number };
  default?: any;
  note?: string;
  index?: boolean;
  enum?: Scalar[];
}
interface Type {
  name: string;
  kind: Kind;
  check(
    value: any,
    path: string,
    def?: Definition,
    schema?: Schema
  ): [] | string[];
  toLong(def: any, Schema: Constructor<Schema>, schema: Schema): object;
  isInstance?(value: any): boolean;
}

export class Schema {
  name: string;
  kind: Kind;
  scope: Scope;
  store: string;
  allow: string;
  namespaces: Set<Model>;
  parent: string;
  fields: object;
  indexes: object;
  references: Set<string>;
  relations: Set<Relation>;
  validate: (value: any, path: string) => { valid: boolean; errors?: [] };
  format: Function;
  parse: Function;
  serialize: Function;

  constructor(name: string, raw: object, namespaces?: Array<Model>);
  preprocess(raw: object): object;
  preprocessType(defs: object): {
    name: string;
    def: object;
    kind?: string;
    metadata?: object;
  };
  preprocessIndex(key: string, def: object): object;
  projection(metadata: object): { defs: { [key: string]: Definition } };
  extractMetadata(metadata: object): void;
  findKind(name: string): Kind | null;
  findType(name: string): Type | null;
  findReferences(name: string): Schema | null;
  isType(name: string): boolean;
  getTypes(): string[];

  public checkConsistency(): Array<string>;
  public check(value: any): { valid: boolean; errors: Array<string> };
  public toInterface(): string;
  public attach(...namespaces: Array<Model>): void;
  public detouch(...namespaces: Array<Model>): void;
  static from(raw: object, namespaces?: Array<Model>): Schema;
  static extractSchema(def: object): Schema | null;

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
