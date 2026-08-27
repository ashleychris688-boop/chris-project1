import { LawFirmProfile } from '../types';

/**
 * Maps standard Kenyan case categories and specific matter types to standard law firm abbreviations.
 * Examples:
 * - Succession & Probate -> SUCC
 * - Civil Litigation -> CIV
 * - Accidents -> ACC
 * - Commercial & Corporate -> COMM
 * - Conveyancing -> CONV
 * - Land & Environment -> ELC
 * - Employment & Labour -> ELRC
 * - Family Law -> FAM
 * - Criminal Matters -> CRIM
 * - Insurance Matters -> INS
 * - Constitutional & Public Law -> CONST
 * - Appeals -> APP
 * - Tribunal Matters -> TRIB
 * - Alternative Dispute Resolution -> ADR
 * - Debt & Recovery -> DEBT
 * - Intellectual Property -> IP
 * - Advisory / Miscellaneous -> ADV
 */
export const CASE_TYPE_ABBREVIATIONS: Record<string, string> = {
  // Succession & Probate
  'Succession & Probate': 'SUCC',
  'Succession Cause': 'SUCC',
  'Probate': 'SUCC',
  'Letters of Administration': 'SUCC',
  'Confirmation of Grant': 'SUCC',
  'Revocation of Grant': 'SUCC',
  'Estate Distribution': 'SUCC',
  'Probate & Estate Administration': 'SUCC',
  'Will Drafting': 'SUCC',
  'Estate Administration': 'SUCC',
  'Probate Dispute': 'SUCC',

  // Civil Litigation
  'Civil Litigation': 'CIV',
  'General Civil Suit': 'CIV',
  'Personal Injury': 'CIV',
  'Road Traffic Accident (RTA)': 'RTA',
  'Declaratory Suit': 'CIV',
  'Recovery of Damages': 'CIV',
  'Breach of Contract': 'CIV',
  'Negligence': 'CIV',
  'Defamation': 'CIV',
  'Debt Recovery': 'CIV',
  'Professional Negligence': 'CIV',
  'Tort Claims': 'CIV',
  'Specific Performance': 'CIV',
  'Injunction Application': 'CIV',
  'Judicial Review': 'JR',

  // Accidents
  'Accidents': 'ACC',
  'Personal Injury Claim': 'ACC',
  'Motor Vehicle Collision': 'ACC',
  'Pedestrian Knockdown': 'ACC',
  'Passenger Injury Claim': 'ACC',
  'Motorcycle / Boda Boda Accident': 'ACC',
  'Workplace Accident (WIBA)': 'WIBA',
  'Fatal Accident / Dependency Claim': 'ACC',
  'Public Service Vehicle (PSV) Accident': 'ACC',
  'Property Damage / Vehicle Repair Claim': 'ACC',

  // Commercial & Corporate
  'Commercial & Corporate': 'COMM',
  'Commercial Dispute': 'COMM',
  'Company Matter': 'COMM',
  'Partnership Dispute': 'COMM',
  'Insolvency': 'COMM',
  'Bankruptcy': 'COMM',
  'Liquidation': 'COMM',
  'Shareholder Dispute': 'COMM',

  // Conveyancing & Land
  'Conveyancing': 'CONV',
  'Sale Agreement': 'CONV',
  'Purchase Agreement': 'CONV',
  'Transfer of Land': 'CONV',
  'Lease Registration': 'CONV',
  'Charge/Mortgage Registration': 'CONV',
  'Discharge of Charge': 'CONV',
  'Land & Environment': 'ELC',
  'Land Dispute': 'ELC',
  'Boundary Dispute': 'ELC',
  'Eviction': 'ELC',
  'Adverse Possession': 'ELC',
  'Land Ownership': 'ELC',
  'Environmental Matter': 'ELC',
  'Easement/Right of Way': 'ELC',
  'Trespass to Land': 'ELC',

  // Employment & Labour
  'Employment & Labour': 'ELRC',
  'Employment Dispute': 'ELRC',
  'Unfair Termination': 'ELRC',
  'Workplace Injury Claim': 'ELRC',
  'Labour Relations Matter': 'ELRC',
  'Employment Appeal': 'ELRC',

  // Family Law
  'Family Law': 'FAM',
  'Divorce': 'FAM',
  'Child Custody': 'FAM',
  'Child Maintenance': 'FAM',
  'Adoption': 'FAM',
  'Guardianship': 'FAM',
  'Domestic Violence (Protection Orders)': 'FAM',
  'Matrimonial Property Dispute': 'FAM',

  // Criminal
  'Criminal Matters': 'CRIM',
  'Criminal Case': 'CRIM',
  'Bail/Bond Application': 'CRIM',
  'Criminal Appeal': 'CRIM',
  'Revision': 'CRIM',
  'Private Prosecution': 'CRIM',

  // Insurance
  'Insurance Matters': 'INS',
  'Insurance Claim': 'INS',
  'Subrogation': 'INS',
  'Recovery Matter': 'INS',
  'Policy Dispute': 'INS',
  'Compensation Claim': 'INS',
  'Motor Accident / Insurance': 'INS',

  // Constitutional
  'Constitutional & Public Law': 'CONST',
  'Constitutional Petition': 'CONST',
  'Human Rights Petition': 'CONST',
  'Election Petition': 'CONST',
  'Public Interest Litigation': 'CONST',

  // Appeals
  'Appeals': 'APP',
  'Civil Appeal': 'APP',
  'Environment & Land Appeal': 'APP',
  'Tax Appeal': 'APP',

  // Tribunals
  'Tribunal Matters': 'TRIB',
  'Business Premises Rent Tribunal (BPRT)': 'BPRT',
  'Co-operative Tribunal': 'TRIB',
  'Tax Appeals Tribunal': 'TAT',
  'Public Procurement Tribunal': 'PPARB',
  'Sports Disputes Tribunal': 'SDT',
  'Political Parties Disputes Tribunal': 'PPDT',
  'Small Claims Court': 'SCC',
  'Environment Tribunal': 'NET',

  // ADR
  'Alternative Dispute Resolution (ADR)': 'ADR',
  'Mediation': 'ADR',
  'Arbitration': 'ARB',
  'Conciliation': 'ADR',
  'Negotiation': 'ADR',

  // Debt & Recovery
  'Debt & Recovery': 'DEBT',
  'Loan Recovery': 'DEBT',
  'Debt Collection': 'DEBT',
  'Execution Proceedings': 'EXEC',
  'Garnishee Proceedings': 'GARN',

  // Intellectual Property
  'Intellectual Property': 'IP',
  'Trademark Registration': 'TM',
  'Copyright Matter': 'CR',
  'Patent Dispute': 'PAT',
  'IP Infringement': 'IP',

  // Immigration & Misc
  'Immigration': 'IMM',
  'Work Permit': 'IMM',
  'Citizenship Application': 'IMM',
  'Visa Appeal': 'IMM',
  'Immigration Advisory': 'IMM',
  'Miscellaneous': 'ADV',
  'Legal Opinion': 'ADV',
  'Demand Letter': 'ADV',
  'Notarial Services': 'NOT',
  'Affidavit & Commissioner for Oaths Services': 'AFF',
  'Company Registration': 'REG',
  'NGO Registration': 'NGO',
  'Advisory': 'ADV'
};

/**
 * Derive the case type abbreviation from a category or specific case type string.
 */
export function getCaseTypeAbbreviation(categoryOrType?: string): string {
  if (!categoryOrType || !categoryOrType.trim()) return 'GEN';

  const clean = categoryOrType.trim();
  if (CASE_TYPE_ABBREVIATIONS[clean]) {
    return CASE_TYPE_ABBREVIATIONS[clean];
  }

  // Check partial key matches
  const lower = clean.toLowerCase();
  if (lower.includes('succ') || lower.includes('probate') || lower.includes('estate') || lower.includes('admin')) {
    return 'SUCC';
  }
  if (lower.includes('accident') || lower.includes('rta') || lower.includes('collision') || lower.includes('knockdown')) {
    return 'ACC';
  }
  if (lower.includes('civil') || lower.includes('litig') || lower.includes('suit') || lower.includes('tort')) {
    return 'CIV';
  }
  if (lower.includes('comm') || lower.includes('corp') || lower.includes('comp') || lower.includes('bankr')) {
    return 'COMM';
  }
  if (lower.includes('conv') || lower.includes('land') || lower.includes('title') || lower.includes('lease') || lower.includes('deed')) {
    return 'CONV';
  }
  if (lower.includes('elc') || lower.includes('environ')) {
    return 'ELC';
  }
  if (lower.includes('lab') || lower.includes('employ') || lower.includes('work') || lower.includes('elrc')) {
    return 'ELRC';
  }
  if (lower.includes('fam') || lower.includes('divorce') || lower.includes('matrim') || lower.includes('child')) {
    return 'FAM';
  }
  if (lower.includes('crim')) {
    return 'CRIM';
  }
  if (lower.includes('insur')) {
    return 'INS';
  }
  if (lower.includes('const') || lower.includes('human right')) {
    return 'CONST';
  }
  if (lower.includes('appeal')) {
    return 'APP';
  }
  if (lower.includes('trib') || lower.includes('small claim')) {
    return 'TRIB';
  }
  if (lower.includes('debt') || lower.includes('recovery')) {
    return 'DEBT';
  }
  if (lower.includes('adr') || lower.includes('arbit') || lower.includes('mediat')) {
    return 'ADR';
  }
  if (lower.includes('ip') || lower.includes('trademark') || lower.includes('patent')) {
    return 'IP';
  }
  if (lower.includes('advis') || lower.includes('opinion')) {
    return 'ADV';
  }

  // Fallback: take first 3-4 alphanumeric uppercase characters
  const sanitized = clean.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return sanitized.slice(0, 4) || 'GEN';
}

/**
 * Preset format options for internal file numbers
 */
export interface FileNumberFormatPreset {
  id: string;
  name: string;
  pattern: string;
  description: string;
  example: string;
}

export const FILE_NUMBER_FORMAT_PRESETS: FileNumberFormatPreset[] = [
  {
    id: 'standard',
    name: 'Standard Practice (Firm / Case Type / Number / Year)',
    pattern: '{INITIALS}/{CASE_TYPE}/{NUMBER}/{YEAR}',
    description: 'Kenyan standard legal practice format with matter abbreviation',
    example: 'NTA/SUCC/08/2026'
  },
  {
    id: 'sequential_simple',
    name: 'Simple Sequential (Firm / Number / Year)',
    pattern: '{INITIALS}/{NUMBER}/{YEAR}',
    description: 'Straightforward firm initials, sequence count, and calendar year',
    example: 'NTA/08/2026'
  },
  {
    id: 'case_year_num',
    name: 'Year Preceded (Firm / Case Type / Year / Number)',
    pattern: '{INITIALS}/{CASE_TYPE}/{YEAR}/{NUMBER}',
    description: 'Category abbreviation followed by calendar year then file number',
    example: 'NTA/SUCC/2026/08'
  },
  {
    id: 'year_first_subfolder',
    name: 'Annual Subfolder (Firm / Year / Case Type / Number)',
    pattern: '{INITIALS}/{YEAR}/{CASE_TYPE}/{NUMBER}',
    description: 'Grouped first by year, then by matter type and sequence',
    example: 'NTA/2026/SUCC/08'
  },
  {
    id: 'hyphenated',
    name: 'Hyphen-Delimited (Firm-Case Type-Number-Year)',
    pattern: '{INITIALS}-{CASE_TYPE}-{NUMBER}-{YEAR}',
    description: 'Compact hyphen-delimited format for physical labels and barcodes',
    example: 'NTA-SUCC-08-2026'
  }
];

/**
 * Format a number with configurable leading zero padding (e.g., 2 -> 08, 3 -> 008, 4 -> 0008, 0 -> 8)
 */
export function formatSequenceNumber(num: number | string, paddingDigits: number = 2): string {
  const parsed = parseInt(String(num), 10);
  if (isNaN(parsed)) return String(num);
  
  if (paddingDigits <= 0) {
    return String(parsed);
  }
  
  return String(parsed).padStart(paddingDigits, '0');
}

export interface FileNumberFormatOptions {
  firmInitials?: string;
  caseTypeOrCategory?: string;
  sequenceNumber?: number | string;
  year?: number | string;
  pattern?: string;
  padding?: number;
  delimiter?: string;
  includeCaseType?: boolean;
}

/**
 * Resolves a file number from a pattern string and variables.
 */
export function buildFormattedFileNumber(options: FileNumberFormatOptions): string {
  const initials = (options.firmInitials || 'LFR').trim().toUpperCase();
  const caseAbbr = options.includeCaseType === false 
    ? '' 
    : getCaseTypeAbbreviation(options.caseTypeOrCategory);
  
  const padding = options.padding !== undefined ? options.padding : 2;
  const numStr = formatSequenceNumber(options.sequenceNumber !== undefined ? options.sequenceNumber : 1, padding);
  const yearStr = String(options.year || new Date().getFullYear()).trim();

  let pattern = options.pattern || '{INITIALS}/{CASE_TYPE}/{NUMBER}/{YEAR}';

  // If includeCaseType is false or caseAbbr is empty and pattern has {CASE_TYPE}, remove {CASE_TYPE} cleanly
  if (!caseAbbr || options.includeCaseType === false) {
    pattern = pattern
      .replace(/\/\{CASE_TYPE\}/g, '')
      .replace(/\{CASE_TYPE\}\//g, '')
      .replace(/-?\{CASE_TYPE\}-?/g, '-')
      .replace(/\{CASE_TYPE\}/g, '');
  }

  let formatted = pattern
    .replace(/\{INITIALS\}/g, initials)
    .replace(/\{CASE_TYPE\}/g, caseAbbr)
    .replace(/\{NUMBER\}/g, numStr)
    .replace(/\{YEAR\}/g, yearStr);

  // Apply custom delimiter if specified and not custom pattern
  if (options.delimiter && options.delimiter !== '/') {
    // If original pattern used slashes, substitute
    if (!options.pattern || options.pattern.includes('/')) {
      formatted = formatted.replace(/\//g, options.delimiter);
    }
  }

  // Clean up any double delimiters or trailing/leading delimiters
  formatted = formatted.replace(/\/+/g, '/').replace(/-+/g, '-').replace(/^\/|\/$/g, '').replace(/^-|-$/g, '');

  return formatted;
}

/**
 * Generates an internal preliminary file number in standard or custom format:
 * e.g. NTA/SUCC/08/2026
 */
export function generatePreliminaryFileNumber(
  firmInitialsOrOptions: string | FileNumberFormatOptions,
  caseTypeOrCategory?: string,
  sequenceNumber?: number | string,
  year?: number | string
): string {
  if (typeof firmInitialsOrOptions === 'object') {
    return buildFormattedFileNumber(firmInitialsOrOptions);
  }

  const initials = (firmInitialsOrOptions || 'LFR').trim().toUpperCase();
  const abbr = getCaseTypeAbbreviation(caseTypeOrCategory);
  const formattedNum = formatSequenceNumber(sequenceNumber !== undefined ? sequenceNumber : 1, 2);
  const y = year || new Date().getFullYear();
  return `${initials}/${abbr}/${formattedNum}/${y}`;
}

/**
 * Formats a direct registry file number in the specified format:
 * e.g. NTA/SUCC/08/2026 or NTA/LIT/042/2026
 */
export function formatDirectFileNumber(
  firmInitialsOrOptions: string | FileNumberFormatOptions,
  caseTypeOrCategory?: string,
  fileNumber?: string | number,
  year?: string | number
): string {
  if (typeof firmInitialsOrOptions === 'object') {
    return buildFormattedFileNumber({
      ...firmInitialsOrOptions,
      sequenceNumber: firmInitialsOrOptions.sequenceNumber !== undefined ? firmInitialsOrOptions.sequenceNumber : (fileNumber || 1)
    });
  }

  const initials = (firmInitialsOrOptions || 'LFR').trim().toUpperCase();
  const abbr = getCaseTypeAbbreviation(caseTypeOrCategory);
  const formattedNum = formatSequenceNumber(fileNumber !== undefined ? fileNumber : 1, 2);
  const y = String(year || new Date().getFullYear()).trim();
  return `${initials}/${abbr}/${formattedNum}/${y}`;
}

/**
 * Calculates next preliminary number for a firm, handling annual reset to zero/starting number.
 */
export function getNextPreliminarySequence(firm?: LawFirmProfile | null): {
  number: number;
  year: number;
  firmInitials: string;
  startingNumber: number;
  padding: number;
  pattern: string;
} {
  const currentYear = new Date().getFullYear();
  const startingNum = firm?.preliminaryStartingNumber !== undefined ? firm.preliminaryStartingNumber : 1;
  const firmInitials = firm?.firmInitials || firm?.fileNumberPrefix || firm?.firmCode?.split('-')[0] || 'LFR';
  const padding = firm?.fileNumberPadding !== undefined ? firm.fileNumberPadding : 2;
  const pattern = firm?.fileNumberFormatPattern || '{INITIALS}/{CASE_TYPE}/{NUMBER}/{YEAR}';
  const shouldResetAnnually = firm?.annualSequenceReset !== false;

  // If new year or year not recorded yet, reset back to starting number (if annual reset enabled)
  if (shouldResetAnnually && (!firm?.preliminaryYear || firm.preliminaryYear < currentYear)) {
    return {
      number: startingNum,
      year: currentYear,
      firmInitials,
      startingNumber: startingNum,
      padding,
      pattern
    };
  }

  // Same year: use next number or starting number
  const nextNum = firm?.preliminaryNextNumber !== undefined ? firm.preliminaryNextNumber : startingNum;
  return {
    number: nextNum,
    year: currentYear,
    firmInitials,
    startingNumber: startingNum,
    padding,
    pattern
  };
}
