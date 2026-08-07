import { RegistryFile } from '../types';

/**
 * Generates system-controlled internal file numbers in the format:
 * {PREFIX}/{NUMBER}/{YEAR}  e.g. NGA/001/2026, NGA/002/2026
 * 
 * - Prefix is set by Admin in System Settings (defaults to "NGA")
 * - Year is current calendar year (updates automatically yearly)
 * - Sequence number is 3-digit padded per year, avoiding duplicates and sharing.
 */
export function generateSystemInternalFileNumber(
  existingFiles: RegistryFile[] = [],
  prefix: string = 'NGA'
): string {
  const currentYear = new Date().getFullYear();
  const cleanPrefix = (prefix && prefix.trim()) ? prefix.trim().toUpperCase() : 'NGA';
  
  let maxSeq = 0;

  existingFiles.forEach(file => {
    if (!file.internalFileNumber) return;
    const parts = file.internalFileNumber.trim().split('/');
    if (parts.length === 3) {
      const [, seqStr, yearStr] = parts;
      const fileYear = parseInt(yearStr, 10);
      const seqNum = parseInt(seqStr, 10);
      
      if (fileYear === currentYear && !isNaN(seqNum)) {
        if (seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const seqPadded = nextSeq.toString().padStart(3, '0');
  
  return `${cleanPrefix}/${seqPadded}/${currentYear}`;
}
