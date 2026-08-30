import React, { useState, useRef } from 'react';
import { RegistryFile, User } from '../types';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  FileCheck2,
  HelpCircle,
  Layers,
  Building2,
  FileText
} from 'lucide-react';
import { 
  parseSpreadsheetFile, 
  mapSpreadsheetRowsToFiles, 
  downloadSampleRegistryCsv 
} from '../utils/fileUploadUtils';

interface BulkImportModalProps {
  existingFiles: RegistryFile[];
  currentUser?: User | null;
  activeFirmCode?: string;
  onClose: () => void;
  onImportComplete: (importedFiles: RegistryFile[]) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  existingFiles,
  currentUser,
  activeFirmCode = 'LFR-MAIN',
  onClose,
  onImportComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [validFiles, setValidFiles] = useState<RegistryFile[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setValidationErrors([]);

    try {
      const rows = await parseSpreadsheetFile(file);
      if (!rows || rows.length === 0) {
        throw new Error('The uploaded spreadsheet appears to be empty or has no data rows.');
      }

      setParsedRows(rows);
      const { validFiles: mapped, errors, duplicateCount: dupes } = mapSpreadsheetRowsToFiles(
        rows, 
        existingFiles, 
        activeFirmCode
      );

      setValidFiles(mapped);
      setValidationErrors(errors);
      setDuplicateCount(dupes);
      setStep('preview');
    } catch (err: any) {
      setValidationErrors([err.message || 'Failed to parse spreadsheet. Please ensure it is a valid Excel (.xlsx) or CSV file.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (validFiles.length === 0) return;
    onImportComplete(validFiles);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#C9A227]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Bulk Import Physical Registry Files</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs">
                  Excel / CSV
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload existing registry records directly into the physical filing cabinet database
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition border border-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {step === 'upload' ? (
            <div className="space-y-5">
              {/* Template Download Banner */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 rounded-lg text-[#C9A227]">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Download Standard Excel Template</h4>
                    <p className="text-[11px] text-slate-400">
                      Pre-formatted template with headers matching Kenyan court stations, physical locations, and capacities.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadSampleRegistryCsv}
                  className="px-3.5 py-1.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template (.xlsx)</span>
                </button>
              </div>

              {/* Upload Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleProcessFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                  isDragging 
                    ? 'border-[#C9A227] bg-[#C9A227]/10' 
                    : 'border-slate-700 hover:border-slate-500 bg-slate-950/60 hover:bg-slate-950'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.csv"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <FileSpreadsheet className="w-12 h-12 mx-auto text-[#C9A227] mb-3 animate-bounce" />
                <h3 className="text-base font-bold text-white mb-1">
                  Upload Excel or CSV File
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Drag and drop your spreadsheet here or click to browse. Supports Microsoft Excel (.xlsx, .xls) and CSV.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-xs text-slate-300">
                  <span>Supported fields: File No, Case No, Client, Opposing Party, Station, Location</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#C9A227]" />
                  <span>Column Auto-Mapping Rules:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                  <li><strong>Internal File Number</strong> (Required): Unique file identifier (e.g. <code>LFR/2026/001</code>).</li>
                  <li><strong>Client Name</strong> (Required): Name of client / plaintiff / claimant.</li>
                  <li><strong>Court Case Number</strong>: e.g. <code>Milimani HCCC No. 104 of 2026</code>.</li>
                  <li><strong>Physical Location</strong>: Cabinet, Shelf Number, and Section details for rapid retrieval.</li>
                  <li>Any duplicate file numbers already in your firm registry will be flagged and safely skipped.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Step 2: Preview & Validation Table */
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Rows Found</span>
                  <span className="text-lg font-bold text-white font-mono">{parsedRows.length}</span>
                </div>

                <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/60">
                  <span className="text-emerald-400 block text-[10px] uppercase font-bold">Valid for Import</span>
                  <span className="text-lg font-bold text-emerald-300 font-mono">{validFiles.length}</span>
                </div>

                <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800/60">
                  <span className="text-amber-400 block text-[10px] uppercase font-bold">Duplicate Files</span>
                  <span className="text-lg font-bold text-amber-300 font-mono">{duplicateCount}</span>
                </div>

                <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-800/60">
                  <span className="text-rose-400 block text-[10px] uppercase font-bold">Errors / Warnings</span>
                  <span className="text-lg font-bold text-rose-300 font-mono">{validationErrors.length}</span>
                </div>
              </div>

              {/* Errors & Warnings if any */}
              {validationErrors.length > 0 && (
                <div className="p-3 bg-amber-950/80 border border-amber-800 rounded-xl space-y-1.5 max-h-36 overflow-y-auto">
                  <div className="font-bold text-amber-200 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Validation Notices ({validationErrors.length})</span>
                  </div>
                  <ul className="text-[11px] text-amber-300/90 list-disc list-inside space-y-0.5 font-mono">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Ready to Import ({validFiles.length} files)
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('upload');
                      setSelectedFile(null);
                      setValidFiles([]);
                    }}
                    className="text-xs text-[#C9A227] hover:underline cursor-pointer"
                  >
                    Choose Different File
                  </button>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-slate-950">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800 font-mono text-[11px]">
                      <tr>
                        <th className="p-2.5">File No.</th>
                        <th className="p-2.5">Court Case No.</th>
                        <th className="p-2.5">Client</th>
                        <th className="p-2.5">Opposing Party</th>
                        <th className="p-2.5">Court Station</th>
                        <th className="p-2.5">Location</th>
                        <th className="p-2.5">Advocate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {validFiles.map((file, i) => (
                        <tr key={i} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-bold font-mono text-[#C9A227]">{file.internalFileNumber}</td>
                          <td className="p-2.5 font-mono text-slate-300">{file.courtCaseNumber}</td>
                          <td className="p-2.5 font-semibold text-white">{file.clientName}</td>
                          <td className="p-2.5 text-slate-300">{file.opposingParty}</td>
                          <td className="p-2.5 text-slate-400">{file.courtStation}</td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-300">
                            {file.physicalLocation.cabinet} - {file.physicalLocation.shelf}
                          </td>
                          <td className="p-2.5 text-slate-300">{file.advocateName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          {step === 'preview' && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={validFiles.length === 0}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer ${
                validFiles.length > 0 
                  ? 'bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Confirm & Import {validFiles.length} Files to Registry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
