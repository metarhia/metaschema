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
  | 'log'
  | 'struct'
  | 'scalar';

export class Schema {
  name: string;
  scope: Scope;
  kind: Kind;
  fields: object;
  indexes: object;
  validate: Function | null;
  format: Function | null;
  parse: Function | null;
  serialize: Function | null;
  constructor(name: string, raw: object);
  preprocess(defs: object): void;
  preprocessIndex(key: string, def: object): object;
  static from(raw: object): Schema;
  check(value: any): { valid: boolean; errors: Array<string> };
}

export function createSchema(name: string, src: string): Schema;
export function loadSchema(fileName: string): Promise<Schema>;
