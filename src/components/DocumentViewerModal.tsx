import React from 'react';
import { FileDocumentAttachment } from '../types';
import { 
  X, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Printer, 
  ExternalLink,
  ShieldAlert,
  Calendar,
  User,
  HardDrive
} from 'lucide-react';
import { formatFileSize, triggerFileDownload } from '../utils/fileUploadUtils';

interface DocumentViewerModalProps {
  document: FileDocumentAttachment | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  onClose
}) => {
  if (!document) return null;

  const isPdf = document.fileType?.toLowerCase().includes('pdf') || document.fileName.toLowerCase().endsWith('.pdf');
  const isImage = document.fileType?.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(document.fileName);

  const handlePrint = () => {
    if (document.dataUrl) {
      const printWindow = window.open(document.dataUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Navigation Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#C9A227]">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {document.title || document.fileName}
                </h3>
                {document.isConfidential && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Confidential
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono truncate">
                File: {document.fileNumber} &bull; {document.category} &bull; {formatFileSize(document.fileSize)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {document.dataUrl && (
              <>
                <button
                  type="button"
                  onClick={() => triggerFileDownload(document.dataUrl!, document.fileName)}
                  className="px-3 py-1.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
                  title="Download document to device"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer border border-slate-700"
                  title="Print document"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 rounded-lg transition border border-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Content View Area */}
        <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-auto flex items-center justify-center relative">
          {document.dataUrl ? (
            isImage ? (
              <div className="max-w-full max-h-full flex items-center justify-center p-2">
                <img 
                  src={document.dataUrl} 
                  alt={document.title} 
                  className="max-w-full max-h-[72vh] object-contain rounded-lg border border-slate-800 shadow-2xl"
                />
              </div>
            ) : isPdf ? (
              <iframe
                src={document.dataUrl}
                title={document.title}
                className="w-full h-full rounded-lg border border-slate-800 bg-white"
              />
            ) : (
              <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-md space-y-4">
                <div className="p-4 bg-slate-800 rounded-2xl inline-block text-amber-400">
                  <FileText className="w-12 h-12" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">{document.fileName}</h4>
                  <p className="text-xs text-slate-400">
                    This file format is ready for local processing. Click below to download and view in your native reader.
                  </p>
                </div>
                <button
                  onClick={() => triggerFileDownload(document.dataUrl!, document.fileName)}
                  className="w-full py-2.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {formatFileSize(document.fileSize)}</span>
                </button>
              </div>
            )
          ) : (
            <div className="text-center text-slate-500 p-8">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No document content stream available.</p>
            </div>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-mono">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Uploaded by: <strong className="text-slate-300">{document.uploadedBy || 'Staff Member'}</strong>
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Date: <strong className="text-slate-300">{document.uploadedAt ? document.uploadedAt.split('T')[0] : 'N/A'}</strong>
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              Size: <strong className="text-slate-300">{formatFileSize(document.fileSize)}</strong>
            </span>
          </div>

          {document.notes && (
            <div className="text-slate-400 italic text-[11px] max-w-md truncate">
              "{document.notes}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
