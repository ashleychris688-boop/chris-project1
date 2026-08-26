import { LawFirmProfile } from '../types';

/**
 * Maps standard Kenyan case categories and specific matter types to standard law firm abbreviations.
 * Examples:
 * - Succession & Probate -> SUCC
 * - Civil Litigation -> LIT
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
  'Civil Litigation': 'LIT',
  'General Civil Suit': 'LIT',
  'Personal Injury': 'LIT',
  'Road Traffic Accident (RTA)': 'RTA',
  'Declaratory Suit': 'LIT',
  'Recovery of Damages': 'LIT',
  'Breach of Contract': 'LIT',
  'Negligence': 'LIT',
  'Defamation': 'LIT',
  'Professional Negligence': 'LIT',
  'Tort Claims': 'LIT',
  'Specific Performance': 'LIT',
  'Injunction Application': 'LIT',
  'Judicial Review': 'JR',

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
  if (lower.includes('litig') || lower.includes('civil') || lower.includes('suit') || lower.includes('tort')) {
    return 'LIT';
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
  if (lower.includes('insur') || lower.includes('accident') || lower.includes('rta')) {
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
 * Format a number with leading zeros (at least 2 digits, e.g. 08, 01, 15, 104)
 */
export function formatSequenceNumber(num: number | string): string {
  const parsed = parseInt(String(num), 10);
  if (isNaN(parsed)) return String(num);
  return parsed < 10 ? `0${parsed}` : String(parsed);
}

/**
 * Generates an internal preliminary file number in standard format:
 * {FIRM_INITIALS}/{CASE_TYPE_ABBR}/{NUMBER_PADDED_2_DIGITS}/{YEAR}
 * e.g. NTA/SUCC/08/2026
 */
export function generatePreliminaryFileNumber(
  firmInitials: string,
  caseTypeOrCategory: string,
  sequenceNumber: number | string,
  year?: number | string
): string {
  const initials = (firmInitials || 'LFR').trim().toUpperCase();
  const abbr = getCaseTypeAbbreviation(caseTypeOrCategory);
  const formattedNum = formatSequenceNumber(sequenceNumber);
  const y = year || new Date().getFullYear();
  return `${initials}/${abbr}/${formattedNum}/${y}`;
}

/**
 * Formats a direct registry file number in the specified format:
 * {FIRM_INITIALS}/{CASE_TYPE_ABBR}/{FILE_NUMBER}/{YEAR}
 * e.g. NTA/SUCC/08/2026 or NTA/LIT/042/2026
 */
export function formatDirectFileNumber(
  firmInitials: string,
  caseTypeOrCategory: string,
  fileNumber: string | number,
  year: string | number
): string {
  const initials = (firmInitials || 'LFR').trim().toUpperCase();
  const abbr = getCaseTypeAbbreviation(caseTypeOrCategory);
  const formattedNum = formatSequenceNumber(fileNumber);
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
} {
  const currentYear = new Date().getFullYear();
  const startingNum = firm?.preliminaryStartingNumber !== undefined ? firm.preliminaryStartingNumber : 1;
  const firmInitials = firm?.firmInitials || firm?.firmCode?.split('-')[0] || 'LFR';

  // If new year or year not recorded yet, reset back to starting number
  if (!firm?.preliminaryYear || firm.preliminaryYear < currentYear) {
    return {
      number: startingNum,
      year: currentYear,
      firmInitials
    };
  }

  // Same year: use next number or starting number
  const nextNum = firm?.preliminaryNextNumber !== undefined ? firm.preliminaryNextNumber : startingNum;
  return {
    number: nextNum,
    year: currentYear,
    firmInitials
  };
}
