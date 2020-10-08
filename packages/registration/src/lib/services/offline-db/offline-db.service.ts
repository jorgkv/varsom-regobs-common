import { Injectable, isDevMode } from '@angular/core';
import { AppModeService, LoggerService, AppMode } from '@varsom-regobs-common/core';
import { OfflineDbServiceOptions } from './offline-db-service.options';
import { RegistrationSchema } from '../../db/schemas/registration.schema';
import {
  createRxDatabase,
  addRxPlugin,
  RxJsonSchema
} from 'rxdb/plugins/core';
import { RxDBNoValidatePlugin } from 'rxdb/plugins/no-validate';
import { RxRegistrationDatabase, RxRegistrationCollections } from '../../db/RxDB';
import { GenericSchema } from '../../db/schemas/generic.schema';
import { from, Observable } from 'rxjs';
import { AttachmentMetaSchema } from '../../db/schemas/attachment-meta.schema';
import { RegistrationSyncProgressSchema } from '../../db/schemas/registration-sync-progress.schema';
import { UploadProgressSchema } from '../../db/schemas/upload-progress.schema';

export const TABLE_NAMES =  {
  REGISTRATION: 'registration',
  KDV_ELEMENTS: 'kdvelements',
  HELP_TEXTS: 'helptexts',
  ATTACHMENT_META: 'attachmentmeta',
  REGISTRATION_SYNC_PROGRESS: 'syncprogress',
  UPLOAD_PROGRESS: 'uploadprogress'
};

const collections: Array<{name: string, schema: RxJsonSchema, instancePerAppMode: boolean}> = [
  {
    name: TABLE_NAMES.REGISTRATION,
    schema: RegistrationSchema,
    instancePerAppMode: true,
  },
  {
    name: TABLE_NAMES.KDV_ELEMENTS,
    schema: GenericSchema,
    instancePerAppMode: true,
  },
  {
    name: TABLE_NAMES.HELP_TEXTS,
    schema: GenericSchema,
    instancePerAppMode: true,
  },
  {
    name: TABLE_NAMES.ATTACHMENT_META,
    schema: AttachmentMetaSchema,
    instancePerAppMode: true,
  },
  {
    name: TABLE_NAMES.REGISTRATION_SYNC_PROGRESS,
    schema: RegistrationSyncProgressSchema,
    instancePerAppMode: false,
  },
  {
    name: TABLE_NAMES.UPLOAD_PROGRESS,
    schema: UploadProgressSchema,
    instancePerAppMode: false,
  },
];

async function loadRxDBPlugins(): Promise<void> {
  if (isDevMode()) {
    await Promise.all([
      // add dev-mode plugin
      // which does many checks and add full error-messages
      import('rxdb/plugins/dev-mode').then(
        module => addRxPlugin(module)
      ),

      // we use the schema-validation only in dev-mode
      // this validates each document if it is matching the jsonschema
      import('rxdb/plugins/validate').then(
        module => addRxPlugin(module)
      )
    ]);
  } else {
    // in production we use the no-validate module instead of the schema-validation
    // to reduce the build-size
    addRxPlugin(RxDBNoValidatePlugin);
  }
}

@Injectable({
  providedIn: 'root'
})
export class OfflineDbService {

  // public readonly appModeInitialized$: Observable<AppMode>;
  private dbInstance: RxRegistrationDatabase;

  constructor(private appModeService: AppModeService, private options: OfflineDbServiceOptions, private logger: LoggerService) {
  }

  async initDatabase(adapter: string): Promise<void> {
    this.dbInstance = await this.create(adapter);
  }

  get db(): RxRegistrationDatabase {
    return this.dbInstance;
  }

  public waitForLeadership(): Observable<boolean> {
    return from(this.dbInstance.waitForLeadership());
  }

  public getDbCollection<T extends RxRegistrationCollections>(appMode: AppMode, tableName: string): T  {
    return this.db[this.getDbCollectionName(appMode, tableName)] as T;
  }

  public getDbCollectionName(appMode: AppMode, tableName: string): string {
    const c = collections.find((c) => c.name === tableName);
    if(!c) {
      throw new Error(`Table ${tableName} not found in collections`);
    }

    if(c.instancePerAppMode) {
      return `${appMode.toLocaleLowerCase()}/${c.name}`;
    }else{
      return c.name;
    }
  }

  private async create(adapter: string): Promise<RxRegistrationDatabase> {

    await loadRxDBPlugins();

    const db = await createRxDatabase<{ [key: string]: RxRegistrationCollections}>({
      name: 'rxdb_regobs_registration',
      adapter,
      pouchSettings: {
        revs_limit: 10, // Max 10 revisions to keep db small
      }
    });

    if (isDevMode()) {
      (window as unknown)['db'] = db; // write to window for debugging
    }

    await Promise.all(this.getCollections().map(colData => db.collection(colData)));

    return db;
  }

  private getCollections() {
    const result: Array<{name: string, schema: RxJsonSchema}> = [];
    for(const c of collections) {
      if(c.instancePerAppMode) {
        for(const appMode of Object.keys(AppMode)) {
          result.push({ name: `${appMode.toLowerCase()}/${c.name}`, schema: c.schema });
        }
      }else{
        result.push(c);
      }
    }
    return result;
  }
}
