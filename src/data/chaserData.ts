import { 
  CaseChaserProfile, 
  ChaserFollowUpLog, 
  ChaserFileResponsibility, 
  ChaserTask,
  UnprocessedClientRecord
} from '../types';

export const STANDARD_MISSING_REQUIREMENTS_CHECKLIST = [
  'Copy of National ID',
  'KRA PIN Certificate',
  'Passport Photo',
  'Police Abstract',
  'P3 Form',
  'Medical Report',
  'Medical Receipts',
  'Treatment Notes',
  'Witness Statement(s)',
  'Demand Letter',
  'Insurance Policy Details',
  'Logbook Copy',
  'Driving Licence',
  'Accident Photos',
  'Death Certificate (where applicable)',
  'Grant of Letters of Administration (where applicable)'
];

export const INITIAL_CASE_CHASERS: CaseChaserProfile[] = [];
export const INITIAL_FOLLOW_UP_LOGS: ChaserFollowUpLog[] = [];
export const INITIAL_FILE_RESPONSIBILITIES: ChaserFileResponsibility[] = [];
export const INITIAL_TASKS: ChaserTask[] = [];
export const INITIAL_UNPROCESSED_RECORDS: UnprocessedClientRecord[] = [];
