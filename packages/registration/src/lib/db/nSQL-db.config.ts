import { InanoSQLTableConfig } from '@nano-sql/core/lib/interfaces';

export const TABLE_NAMES = {
    REGISTRATION: 'registration',
    USER_SETTINGS: 'usersettings',
};

export const DB_NAME_TEMPLATE = 'regobs_registration';

export const DB_TABLE_CONFIG: InanoSQLTableConfig[] = [
    {
        name: TABLE_NAMES.REGISTRATION,
        model: {
            'id:uuid': { pk: true },
            '*:any': {}
        }
    },
    {
        name: TABLE_NAMES.USER_SETTINGS,
        model: {
            'id:string': { pk: true },
            '*:any': {}
        }
    }
];