import { NgModule, ModuleWithProviders, InjectionToken } from '@angular/core';
import { CoreModule } from '@varsom-regobs-common/core';
import { FakeItemSyncCallbackService } from './services/item-sync-callback/fake-item-sync-callback.service';
import { RegobsApiSyncCallbackService } from './services/item-sync-callback/regobs-api-sync-callback.service';
import { RegobsApiModuleWithConfig, KdvElementsService, HelptextService as HelpTextApiService } from '@varsom-regobs-common/regobs-api';
import { InanoSQLAdapter } from '@nano-sql/core/lib/interfaces';
import { OfflineDbServiceOptions } from './services/offline-db/offline-db-service.options';
import { TranslateModule } from '@ngx-translate/core';
import { ISummaryProvider } from './services/summary-providers/summary-provider.interface';
import { GeneralObservationSummaryProvider } from './services/summary-providers/general-observation/general-observation.summary-provider';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpConnectivityInterceptor } from 'ngx-connectivity';
import { InMemoryAddNewAttachmentService } from './services/add-new-attachment/in-memory-add-new-attachment.service';
import { AddNewAttachmentService } from './services/add-new-attachment/add-new-attachment.service';
import { throwError } from 'rxjs';
import { WeatherSummaryProvider } from './services/summary-providers/snow/weather/weather.summary-provider';
import { RegobsRegistrationPipesModule } from './registration.pipes';

export const FOR_ROOT_OPTIONS_TOKEN = new InjectionToken<IRegistrationModuleOptions>('forRoot() Module configuration');
export const SUMMARY_PROVIDER_TOKEN = new InjectionToken<ISummaryProvider>('Registration summary provider token');

export interface IRegistrationModuleOptions {
  dbMode?: string | InanoSQLAdapter;
  autoSync?: boolean;
}

export function offlineDbServiceOptionsFactory(options?: IRegistrationModuleOptions): OfflineDbServiceOptions {
  const offlineDbServiceOptions = new OfflineDbServiceOptions();
  // If the optional options were provided via the .forRoot() static method, then apply
  // them to the MyServiceOptions Type provider.
  if (options) {
    if (options.dbMode) {
      offlineDbServiceOptions.dbMode = options.dbMode;
    }
  }
  return offlineDbServiceOptions;
}

export function getFakeKdvElementsService() {
  const fakeService = { KdvElementsGetKdvs: () => throwError(Error('Fake service')) };
  return fakeService;
}

export function getFakeHelpTextApiService() {
  const fakeService = { HelptextGet: () => throwError(Error('Fake service')) };
  return fakeService;
}

@NgModule({
  imports: [
    CoreModule,
    RegobsApiModuleWithConfig,
    TranslateModule,
  ],
  declarations: [],
  exports: [
    RegobsRegistrationPipesModule,
  ]
})
export class RegistrationModule {
  static forRoot(options?: IRegistrationModuleOptions): ModuleWithProviders<RegistrationModule> {
    return ({
      ngModule: RegistrationModule,
      providers: [
        {
          provide: FOR_ROOT_OPTIONS_TOKEN,
          useValue: options
        },
        {
          provide: OfflineDbServiceOptions,
          useFactory: offlineDbServiceOptionsFactory,
          deps: [FOR_ROOT_OPTIONS_TOKEN]
        },
        {
          provide: 'OfflineRegistrationSyncService', useClass: RegobsApiSyncCallbackService
        },
        {
          provide: SUMMARY_PROVIDER_TOKEN, useClass: GeneralObservationSummaryProvider, multi: true
        },
        {
          provide: SUMMARY_PROVIDER_TOKEN, useClass: WeatherSummaryProvider, multi: true
        },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: HttpConnectivityInterceptor,
          multi: true
        },
        {
          provide: AddNewAttachmentService, useClass: InMemoryAddNewAttachmentService
        }
      ]
    });
  }

  static forChild(options?: IRegistrationModuleOptions): ModuleWithProviders<RegistrationModule> {
    return RegistrationModule.forRoot(options);
  }

  static forTesting(): ModuleWithProviders<RegistrationModule> {
    return ({
      ngModule: RegistrationModule,
      providers: [
        {
          provide: FOR_ROOT_OPTIONS_TOKEN,
          useValue: { dbMode: 'TEMP' }
        },
        {
          provide: OfflineDbServiceOptions,
          useValue: { dbMode: 'TEMP' },
        },
        {
          provide: 'OfflineRegistrationSyncService', useClass: FakeItemSyncCallbackService
        },
        {
          provide: SUMMARY_PROVIDER_TOKEN, useClass: GeneralObservationSummaryProvider, multi: true
        },
        {
          provide: SUMMARY_PROVIDER_TOKEN, useClass: WeatherSummaryProvider, multi: true
        },
        {
          provide: AddNewAttachmentService, useClass: InMemoryAddNewAttachmentService
        },
        { provide: KdvElementsService, useFactory: getFakeKdvElementsService },
        { provide: HelpTextApiService, useFactory: getFakeHelpTextApiService },
      ]
    });
  }
}
