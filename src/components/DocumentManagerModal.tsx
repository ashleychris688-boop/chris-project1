import React, { useState, useRef } from 'react';
import { RegistryFile, FileDocumentAttachment, DocumentCategory, User } from '../types';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Trash2, 
  Download, 
  Eye, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  FolderOpen,
  Search,
  Filter,
  Paperclip,
  Tag
} from 'lucide-react';
import { 
  DOCUMENT_CATEGORIES, 
  formatFileSize, 
  readFileAsDataUrl, 
  triggerFileDownload 
} from '../utils/fileUploadUtils';

interface DocumentManagerModalProps {
  file: RegistryFile;
  documents: FileDocumentAttachment[];
  currentUser?: User | null;
  onClose: () => void;
  onAddDocument: (doc: FileDocumentAttachment) => void;
  onDeleteDocument: (docId: string) => void;
  onViewDocument: (doc: FileDocumentAttachment) => void;
  preselectedCategory?: DocumentCategory;
  corumId?: string;
}

export const DocumentManagerModal: React.FC<DocumentManagerModalProps> = ({
  file,
  documents,
  currentUser,
  onClose,
  onAddDocument,
  onDeleteDocument,
  onViewDocument,
  preselectedCategory = 'Pleadings & Petitions',
  corumId
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>(preselectedCategory);
  const [documentTitle, setDocumentTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter documents for this specific file
  const fileDocs = documents.filter(d => 
    (d.fileId && (d.fileId === file.id || d.fileId === file.internalFileNumber)) || 
    (d.fileNumber && (
      d.fileNumber.trim().toLowerCase() === file.internalFileNumber.trim().toLowerCase() ||
      d.fileNumber.trim().toLowerCase() === file.id.trim().toLowerCase()
    ))
  );

  const filteredDocs = fileDocs.filter(d => {
    const matchesCategory = filterCategory === 'ALL' || d.category === filterCategory;
    const matchesSearch = searchTerm === '' || 
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.notes && d.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleFilesSelected = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploading(true);

    try {
      for (let i = 0; i < filesList.length; i++) {
        const rawFile = filesList[i];
        
        // 25MB max size check
        if (rawFile.size > 25 * 1024 * 1024) {
          throw new Error(`File "${rawFile.name}" exceeds the 25MB maximum upload limit.`);
        }

        const dataUrl = await readFileAsDataUrl(rawFile);
        const titleToUse = documentTitle.trim() || rawFile.name.replace(/\.[^/.]+$/, "");

        const newDoc: FileDocumentAttachment = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          firmCode: file.firmCode || currentUser?.firmCode || 'LFR-001',
          fileId: file.id,
          fileNumber: file.internalFileNumber,
          corumId: corumId,
          title: titleToUse,
          category: selectedCategory,
          fileName: rawFile.name,
          fileType: rawFile.type || 'application/octet-stream',
          fileSize: rawFile.size,
          dataUrl: dataUrl,
          uploadedBy: currentUser?.fullName || currentUser?.username || 'Advocate / Clerk',
          uploadedAt: new Date().toISOString(),
          notes: notes.trim(),
          isConfidential: isConfidential
        };

        onAddDocument(newDoc);
      }

      setSuccessMessage(`Successfully uploaded ${filesList.length} document${filesList.length === 1 ? '' : 's'}.`);
      setDocumentTitle('');
      setNotes('');
      setIsConfidential(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
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
              <Paperclip className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>File Documents & Pleadings</span>
                <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-[#C9A227] font-mono text-xs">
                  {file.internalFileNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {file.clientName} v {file.opposingParty} &bull; {file.courtCaseNumber}
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
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Status Feedback */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Upload Drop Zone Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-[#C9A227]" />
              <span>Upload Document / Court Order / Scanned Folio</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Document Category</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value as DocumentCategory)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-[#C9A227]"
                >
                  {DOCUMENT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Custom Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Injunction Ruling Dated 28th Aug"
                  value={documentTitle}
                  onChange={e => setDocumentTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#C9A227]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs items-center">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Notes / Folio Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Folio 45-48, certified copy"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="confidential-check"
                  checked={isConfidential}
                  onChange={e => setIsConfidential(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-[#C9A227] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="confidential-check" className="text-xs text-slate-300 flex items-center gap-1 cursor-pointer">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Mark as Confidential / Sensitive File
                </label>
              </div>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragging 
                  ? 'border-[#C9A227] bg-[#C9A227]/10' 
                  : 'border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-900'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.webp,.txt"
                onChange={e => handleFilesSelected(e.target.files)}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 mx-auto text-[#C9A227] mb-2 animate-pulse" />
              <p className="text-sm font-bold text-slate-200">
                Click to browse or drag & drop files here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported: PDF, Images (PNG, JPG), Word DOCX (up to 25MB)
              </p>
            </div>
          </div>

          {/* Existing Uploaded Documents Section */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#C9A227]" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Attached Documents on Record ({fileDocs.length})
                </h3>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 text-xs">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search docs..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-8 pr-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#C9A227] text-xs"
                  />
                </div>

                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-[#C9A227]"
                >
                  <option value="ALL">All Categories</option>
                  {DOCUMENT_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 space-y-1">
                <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-slate-300">No documents attached yet</p>
                <p className="text-xs text-slate-500">
                  Upload scanned pleadings, court orders, or correspondence using the drop zone above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredDocs.map(doc => (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3 shadow-md group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-[#C9A227] shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-[#C9A227] transition">
                              {doc.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              {doc.fileName}
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 border border-slate-700 text-slate-300 shrink-0">
                          {formatFileSize(doc.fileSize)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/60 text-[#C9A227] border border-amber-800/60 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          {doc.category}
                        </span>

                        {doc.isConfidential && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            Confidential
                          </span>
                        )}
                      </div>

                      {doc.notes && (
                        <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-1.5 rounded border border-slate-800">
                          "{doc.notes}"
                        </p>
                      )}
                    </div>

                    {/* Actions and Uploader details */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-500 font-mono text-[10px]">
                        By: <strong className="text-slate-400">{doc.uploadedBy}</strong> &bull; {doc.uploadedAt ? doc.uploadedAt.split('T')[0] : ''}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewDocument(doc)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-xs transition flex items-center gap-1 border border-slate-700 cursor-pointer"
                          title="Preview document"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>View</span>
                        </button>

                        {doc.dataUrl && (
                          <button
                            type="button"
                            onClick={() => triggerFileDownload(doc.dataUrl!, doc.fileName)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition border border-slate-700 cursor-pointer"
                            title="Download document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete attachment "${doc.title}"?`)) {
                              onDeleteDocument(doc.id);
                            }
                          }}
                          className="p-1.5 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded-lg transition border border-slate-700 cursor-pointer"
                          title="Delete attachment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-400 font-mono">
            {fileDocs.length} Total attached document{fileDocs.length === 1 ? '' : 's'} on record
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Close Document Vault
          </button>
        </div>
      </div>
    </div>
  );
};
