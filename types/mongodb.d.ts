declare module "mongodb" {
  export class MongoClient {
    constructor(uri: string, options?: any);
    db(dbName?: string): any;
    connect(): Promise<this>;
    close(): Promise<void>;
  }

  export class ObjectId {
    constructor(id?: string);
    toHexString(): string;
    toString(): string;
  }

  export function ObjectIdFromHex(id: string): ObjectId;

  export { MongoClient, ObjectId };
}
