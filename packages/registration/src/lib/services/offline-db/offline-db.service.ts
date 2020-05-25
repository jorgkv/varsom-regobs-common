import { Injectable } from '@angular/core';
import { AppMode, AppModeService, LoggerService } from '@varsom-regobs-common/core';
import { NSQL_TABLE_NAME_PLUGIN } from '../../db/nSQL-table-name.plugin';
import { Observable, from } from 'rxjs';
import { switchMap, shareReplay, tap, distinctUntilChanged } from 'rxjs/operators';
import { DB_NAME_TEMPLATE, DB_TABLE_CONFIG } from '../../db/nSQL-db.config';
import { nSQL } from '@nano-sql/core';
import { OfflineDbServiceOptions } from './offline-db-service.options';

@Injectable({
  providedIn: 'root'
})
export class OfflineDbService {

  public readonly appModeInitialized$: Observable<AppMode>;

  constructor(private appModeService: AppModeService, private options: OfflineDbServiceOptions, private logger: LoggerService) {
    this.appModeInitialized$ = this.appModeService.appMode$.pipe(
      distinctUntilChanged(),
      switchMap((appMode) => this.initAppMode(appMode)),
      tap((val) => logger.log('App mode initalized', val)),
      shareReplay(1));
  }

  private getDbName(appMode: AppMode): string {
    return `${DB_NAME_TEMPLATE}_${appMode}`;
  }

  private initAppMode(appMode: AppMode) {
    this.logger.log('initAppMode', appMode);
    return from(this.createDbIfNotExist(appMode));
  }

  public getDbInstance(appMode: AppMode) {
    return nSQL().useDatabase(this.getDbName(appMode));
  }

  public getOfflineRecords<T>(appMode: AppMode, table: string, key: string, keyValue: string | number): Promise<T[]> {
    return this.getDbInstance(appMode).selectTable(table).query('select').where([`${key}`, '=', keyValue]).exec() as Promise<T[]>;
  }

  public saveOfflineRecords<T>(appMode: AppMode, table: string, data: T | T[]): Promise<T[]> {
    return this.getDbInstance(appMode).selectTable(table).query('upsert', data).exec() as Promise<T[]>;
  }

  private async createDbIfNotExist(appMode: AppMode): Promise<AppMode> {
    const dbName = this.getDbName(appMode);
    const exists = nSQL().listDatabases().indexOf(dbName) >= 0;
    if (!exists) {
      try{
        await nSQL().createDatabase({
          id: this.getDbName(appMode),
          mode: this.options.dbMode,
          tables: DB_TABLE_CONFIG,
          plugins: [
            NSQL_TABLE_NAME_PLUGIN
          ],
        });
      }catch(err) {
        this.logger.warn(`Could not create database for app mode: ${appMode}`, err);
      }
    }
    return appMode;
  }
}
