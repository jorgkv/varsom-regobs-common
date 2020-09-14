import { RxDocument, RxCollection, RxDatabase } from 'rxdb';
import { IRegistration } from '../models/registration.interface';
import { KdvElementsResponseDto } from '@varsom-regobs-common/regobs-api';
import { HelptextDto } from '@varsom-regobs-common/regobs-api';
import { OfflineSyncMeta } from '../models/offline-sync-meta.interface';

export type RxRegistrationDocument = RxDocument<IRegistration>;
export type RxKdvDocument = RxDocument<OfflineSyncMeta<KdvElementsResponseDto>>;
export type HelpTextDocument = RxDocument<OfflineSyncMeta<HelptextDto[]>>;

export type RxRegistrationCollection = RxCollection<IRegistration>;
export type RxKdvCollection = RxCollection<OfflineSyncMeta<KdvElementsResponseDto>>;
export type RxHelpTextCollection = RxCollection<OfflineSyncMeta<HelptextDto[]>>;

export type RxRegistrationCollections = {
    'prod/registration': RxRegistrationCollection;
    'demo/registration': RxRegistrationCollection;
    'test/registration': RxRegistrationCollection;
    'prod/kdvelements': RxKdvCollection;
    'demo/kdvelements': RxKdvCollection;
    'test/kdvelements': RxKdvCollection;
    'prod/helptexts': RxHelpTextCollection;
    'demo/helptexts': RxHelpTextCollection;
    'test/helptexts': RxHelpTextCollection;
};

export type RxRegistrationDatabase = RxDatabase<RxRegistrationCollections>;