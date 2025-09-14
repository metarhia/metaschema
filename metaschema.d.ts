type Scope = 'global' | 'system' | 'local' | 'application';

type Allow = 'read' | 'write' | 'append';

type Store = 'persistent' | 'memory';

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

interface ValidationResult {
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

  kind: Kind;
  scope: Scope;
  store: Store;
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
  references: Set<string>;
  relations: Set<Relation>;

  constructor(name: string, raw: object, namespaces?: Array<Model>);
  get types(): object;
  checkConsistency(): Array<string>;
  findReference(name: string): Schema;
  check(value: unknown, path?: string): ValidationResult;
  toInterface(): string;
  attach(...namespaces: Array<Model>): void;
  detouch(...namespaces: Array<Model>): void;
  toString(): string;
  toJSON(): object;
  validate(value: unknown, path: string): ValidationResult;
}

export function createSchema(name: string, src: string): Schema;
export function loadSchema(fileName: string): Promise<Schema>;
export function readDirectory(dirPath: string): Promise<Map<string, object>>;
export function loadModel(
  modelPath: string,
  systemTypes?: object,
): Promise<Model>;
export function saveTypes(outputFile: string, model: Model): Promise<void>;
export function getKindMetadata(
  kind: Kind,
  meta?: object,
  root?: Schema,
): { defs: object; metadata: object };

export class Model {
  types: object;
  entities: Map<string, Schema>;
  database: object;
  order: Set<string>;
  warnings: Array<string>;

  constructor(types: object, entities: Map<string, object>, database?: object);
  preprocess(): void;
  reorderEntity(name: string, base?: string): void;
  get dts(): string;
}

export const KIND: Array<string>;
export const KIND_STORED: Array<string>;
export const KIND_MEMORY: Array<string>;
export const SCOPE: Array<string>;
export const STORE: Array<string>;
export const ALLOW: Array<string>;
