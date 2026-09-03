import * as XLSX from 'xlsx';
import { RegistryFile, DocumentCategory } from '../types';

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'Pleadings & Petitions',
  'Court Orders & Decrees',
  'Rulings & Judgments',
  'Affidavits & Statements',
  'Notices & Summons',
  'Correspondence & Letters',
  'Client KYC & Retainer',
  'Evidence & Exhibits',
  'Invoices & Fee Notes',
  'Other'
];

/**
 * Format raw bytes into human readable size
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Convert browser File object to Base64 Data URL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Download a string or Blob as a named file in the browser
 */
export function triggerFileDownload(dataUrlOrBlobUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrlOrBlobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parse an uploaded CSV or XLSX file and return raw row objects
 */
export async function parseSpreadsheetFile(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          return resolve([]);
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate a downloadable sample CSV template for Registry files
 */
export function downloadSampleRegistryCsv() {
  const headers = [
    'Internal File Number',
    'Court Case Number',
    'Client Name',
    'Opposing Party',
    'Court Station',
    'Court Number / Division',
    'Presiding Magistrate / Judge',
    'Assigned Advocate',
    'Assigned Clerk',
    'Cabinet',
    'Shelf Number',
    'Section / Compartment',
    'Current Status',
    'Case Category',
    'Case Nature / Type',
    'Notes / Remarks'
  ];

  const sampleRows = [
    [
      'LFR/2026/001',
      'Milimani HCCC No. 104 of 2026',
      'Acme Logistics Ltd',
      'Apex Hauliers & Cargo Ltd',
      'Milimani Commercial Courts',
      'Court 4',
      'Hon. J. K. Mwangi',
      'Anthony Omollo',
      'Faith Mwende',
      'Cabinet A',
      'Shelf 2',
      'Commercial Registry',
      'Active In Court',
      'Commercial & Corporate',
      'Breach of Freight Contract',
      'Pleadings served, awaiting defence.'
    ],
    [
      'LFR/2026/002',
      'Mombasa ELRC Cause No. 45 of 2026',
      'David Otieno',
      'Coastline Shipping Agencies',
      'Mombasa Law Courts',
      'Court 2',
      'Hon. Lady Justice Chebet',
      'Anthony Omollo',
      'James Mutua',
      'Cabinet B',
      'Shelf 1',
      'Employment Division',
      'In Registry',
      'Employment & Labour',
      'Unlawful Summary Dismissal',
      'Hearing on formal proof set for next term.'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registry_Template');
  XLSX.writeFile(wb, 'Registry_Files_Sample_Template.xlsx');
}

/**
 * Map arbitrary spreadsheet rows to standard RegistryFile objects
 */
export function mapSpreadsheetRowsToFiles(
  rows: Record<string, any>[],
  existingFiles: RegistryFile[],
  firmCode: string = 'LFR-001'
): { validFiles: RegistryFile[]; errors: string[]; duplicateCount: number } {
  const validFiles: RegistryFile[] = [];
  const errors: string[] = [];
  let duplicateCount = 0;

  const existingFileNumbers = new Set(existingFiles.map(f => f.internalFileNumber.trim().toLowerCase()));

  rows.forEach((row, index) => {
    const rowNum = index + 2; // spreadsheet 1-based + 1 header row

    // Find keys matching common variations
    const getVal = (...keys: string[]): string => {
      for (const k of keys) {
        for (const rowKey of Object.keys(row)) {
          if (rowKey.trim().toLowerCase() === k.toLowerCase()) {
            return String(row[rowKey] || '').trim();
          }
        }
      }
      return '';
    };

    const internalFileNumber = getVal(
      'internal file number', 'file number', 'internal fileno', 'filenumber', 
      'file_no', 'file no', 'file no.', 'file-no', 'file ref', 'ref no', 'ref no.', 
      'matter no', 'our ref', 'file id', 'internal ref', 'file #'
    );
    const clientName = getVal('client name', 'client', 'plaintiff', 'applicant', 'claimant', 'party name', 'name', 'client/plaintiff');
    const courtCaseNumber = getVal('court case number', 'case number', 'court case no', 'suit number', 'case no', 'case no.', 'plaint no', 'cause no');
    const opposingParty = getVal('opposing party', 'defendant', 'respondent', 'other party', 'accused', 'opposite party');
    const courtStation = getVal('court station', 'station', 'court', 'court location', 'venue');
    const courtNumber = getVal('court number / division', 'court number', 'court no', 'division', 'court room');
    const magistrate = getVal('presiding magistrate / judge', 'magistrate', 'judge', 'coram', 'judge / magistrate');
    const advocateName = getVal('assigned advocate', 'advocate', 'counsel', 'lawyer', 'assigned counsel');
    const clerkName = getVal('assigned clerk', 'clerk', 'registry clerk', 'court clerk');
    const cabinet = getVal('cabinet', 'cabinet name', 'cabinet no');
    const shelf = getVal('shelf number', 'shelf', 'shelf no', 'shelf #');
    const section = getVal('section / compartment', 'section', 'compartment', 'pigeon hole', 'drawer');
    const rawStatus = getVal('current status', 'status', 'file status');
    const caseCategory = getVal('case category', 'category', 'division');
    const caseType = getVal('case nature / type', 'case type', 'nature of case', 'cause of action');
    const notes = getVal('notes / remarks', 'notes', 'remarks', 'comment', 'comments');

    if (!internalFileNumber && !clientName) {
      // Empty row, skip silently
      return;
    }

    if (!internalFileNumber) {
      errors.push(`Row ${rowNum}: Missing Internal File Number.`);
      return;
    }

    if (!clientName) {
      errors.push(`Row ${rowNum} (${internalFileNumber}): Missing Client Name.`);
      return;
    }

    if (existingFileNumbers.has(internalFileNumber.toLowerCase())) {
      duplicateCount++;
      errors.push(`Row ${rowNum} (${internalFileNumber}): File number already exists in registry.`);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Normalize status to supported RegistryFile status values
    let normalizedStatus: RegistryFile['currentStatus'] = 'In Registry';
    const sLower = rawStatus.toLowerCase();
    if (sLower.includes('court') && !sLower.includes('closed')) {
      normalizedStatus = 'In Court';
    } else if (sLower.includes('advocate') || sLower.includes('counsel')) {
      normalizedStatus = 'With Advocate';
    } else if (sLower.includes('pending') || sLower.includes('judgment') || sLower.includes('ruling')) {
      normalizedStatus = 'Pending Judgment';
    } else if (sLower.includes('closed') || sLower.includes('concluded')) {
      normalizedStatus = 'Closed';
    } else if (sLower.includes('archived')) {
      normalizedStatus = 'Archived';
    } else if (sLower.includes('transit')) {
      normalizedStatus = 'In Transit';
    } else {
      normalizedStatus = 'In Registry';
    }

    const newFile: RegistryFile = {
      id: `file-import-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      firmCode: firmCode,
      internalFileNumber: internalFileNumber,
      courtCaseNumber: courtCaseNumber || 'Pending Filing / Unassigned',
      clientName: clientName,
      opposingParty: opposingParty || 'N/A',
      courtStation: courtStation || 'Milimani Law Courts',
      courtNumber: courtNumber || 'Court 1',
      magistrate: magistrate || 'Presiding Magistrate',
      advocateName: advocateName || 'Lead Counsel',
      clerkName: clerkName || 'Registry Clerk',
      secretaryName: 'Office Admin',
      caseChaserName: 'Field Officer',
      insuranceCompanyName: 'N/A',
      currentStatus: normalizedStatus,
      physicalLocation: {
        room: 'Main Registry Room',
        cabinet: cabinet || 'Cabinet A',
        shelf: shelf || 'Shelf 1',
        detail: section || 'General Registry'
      },
      dateOpened: todayStr,
      notes: notes || '',
      caseCategory: caseCategory || 'Civil Litigation',
      caseType: caseType || 'General Matter'
    };

    validFiles.push(newFile);
    existingFileNumbers.add(internalFileNumber.toLowerCase());
  });

  return { validFiles, errors, duplicateCount };
}
