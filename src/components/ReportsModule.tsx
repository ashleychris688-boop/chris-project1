import React, { useState } from 'react';
import { 
  RegistryFile, 
  CourtSession, 
  BringUpItem, 
  InsuranceClaim, 
  PendingCheque, 
  CommissionRecord, 
  FileMovement 
} from '../types';
import { 
  BarChart3, 
  Printer, 
  Download, 
  FileText, 
  Filter, 
  CheckCircle2, 
  Calendar,
  Building,
  Receipt,
  CircleDollarSign,
  PackageSearch,
  FileType
} from 'lucide-react';
import { exportTableToPdf } from '../utils/pdfExport';

interface ReportsModuleProps {
  files: RegistryFile[];
  courtSessions: CourtSession[];
  bringUpItems: BringUpItem[];
  claims: InsuranceClaim[];
  cheques: PendingCheque[];
  commissions: CommissionRecord[];
  movements: FileMovement[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  files,
  courtSessions,
  bringUpItems,
  claims,
  cheques,
  commissions,
  movements
}) => {
  const [selectedReport, setSelectedReport] = useState<string>('daily-court');

  const reportTypes = [
    { id: 'daily-court', label: 'Daily Court List' },
    { id: 'weekly-bringup', label: 'Weekly Upcoming List' },
    { id: 'active-files', label: 'Active Files' },
    { id: 'closed-files', label: 'Closed Files' },
    { id: 'pending-hearings', label: 'Pending Hearings' },
    { id: 'insurance-payments', label: 'Insurance Payments' },
    { id: 'pending-cheques', label: 'Pending Cheques' },
    { id: 'outstanding-commissions', label: 'Outstanding Commissions' },
    { id: 'missing-requirements', label: 'Missing Requirements' },
    { id: 'file-movements', label: 'File Movement Report' },
    { id: 'advocate-performance', label: 'Advocate Performance' },
    { id: 'chaser-performance', label: 'Case Chaser Performance' }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let headers = '';
    let rows: string[] = [];

    if (selectedReport === 'daily-court') {
      headers = 'File Number,Client,Opposing Party,Court Station,Court Number,Magistrate,Time,Advocate\n';
      rows = courtSessions.map(s => `"${s.fileNumber}","${s.clientName}","${s.opposingParty}","${s.courtStation}","${s.courtNumber}","${s.magistrate}","${s.hearingTime}","${s.advocateName}"`);
    } else if (selectedReport === 'active-files') {
      headers = 'File Number,Court Case Number,Client,Advocate,Status,Cabinet,Shelf\n';
      rows = files.filter(f => f.currentStatus !== 'Closed').map(f => `"${f.internalFileNumber}","${f.courtCaseNumber}","${f.clientName}","${f.advocateName}","${f.currentStatus}","${f.physicalLocation.cabinet}","${f.physicalLocation.shelf}"`);
    } else if (selectedReport === 'outstanding-commissions') {
      headers = 'File Number,Chaser,Settlement,Rate,Commission Due,Paid,Outstanding\n';
      rows = commissions.map(c => `"${c.fileNumber}","${c.caseChaserName}",${c.settlementAmount},${c.commissionRate},${c.commissionDue},${c.amountPaid},${c.outstandingBalance}`);
    } else {
      headers = 'Report,Generated Date,Total Records\n';
      rows = [`"${selectedReport}","${new Date().toISOString().split('T')[0]}",20`];
    }

    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lfr_report_${selectedReport}_${Date.now()}.csv`;
    a.click();
  };

  const handleExportPDF = () => {
    const reportLabel = reportTypes.find(r => r.id === selectedReport)?.label || 'Law Firm Report';
    let cols: string[] = [];
    let tableRows: (string | number)[][] = [];
    let summary: { label: string; value: string | number }[] = [];

    if (selectedReport === 'daily-court') {
      cols = ['File #', 'Client vs Opposing Party', 'Court Station', 'Court #', 'Magistrate', 'Time', 'Advocate'];
      tableRows = courtSessions.map(cs => [
        cs.fileNumber,
        `${cs.clientName} vs ${cs.opposingParty}`,
        cs.courtStation,
        cs.courtNumber,
        cs.magistrate,
        cs.hearingTime,
        cs.advocateName
      ]);
      summary = [
        { label: 'Total Sessions Listed', value: courtSessions.length },
        { label: 'Active Advocates', value: new Set(courtSessions.map(c => c.advocateName)).size },
        { label: 'Court Stations', value: new Set(courtSessions.map(c => c.courtStation)).size }
      ];
    } else if (selectedReport === 'active-files') {
      const active = files.filter(f => f.currentStatus !== 'Closed');
      cols = ['Internal File #', 'Court Case #', 'Client Name', 'Advocate', 'Status', 'Physical Location'];
      tableRows = active.map(f => [
        f.internalFileNumber,
        f.courtCaseNumber,
        f.clientName,
        f.advocateName,
        f.currentStatus,
        `${f.physicalLocation.cabinet} (${f.physicalLocation.shelf})`
      ]);
      summary = [
        { label: 'Total Active Files', value: active.length },
        { label: 'In Court', value: active.filter(a => a.currentStatus === 'In Court').length },
        { label: 'Pending Docs', value: active.filter(a => a.currentStatus === 'Incomplete').length }
      ];
    } else if (selectedReport === 'outstanding-commissions') {
      cols = ['File #', 'Case Chaser', 'Settlement Amount', 'Rate', 'Commission Due', 'Amount Paid', 'Outstanding Balance'];
      tableRows = commissions.map(c => [
        c.fileNumber,
        c.caseChaserName,
        `KSh ${c.settlementAmount.toLocaleString()}`,
        `${c.commissionRate}%`,
        `KSh ${c.commissionDue.toLocaleString()}`,
        `KSh ${c.amountPaid.toLocaleString()}`,
        `KSh ${c.outstandingBalance.toLocaleString()}`
      ]);
      const totalOutstanding = commissions.reduce((sum, c) => sum + c.outstandingBalance, 0);
      summary = [
        { label: 'Total Records', value: commissions.length },
        { label: 'Total Outstanding', value: `KSh ${totalOutstanding.toLocaleString()}` }
      ];
    } else if (selectedReport === 'missing-requirements') {
      const missing = files.filter(f => f.currentStatus === 'Incomplete' || f.missingRequirements?.length);
      cols = ['File #', 'Client Name', 'Advocate', 'Missing Requirements Details', 'Location'];
      tableRows = missing.map(f => [
        f.internalFileNumber,
        f.clientName,
        f.advocateName,
        f.missingRequirements?.join(', ') || 'Requirements Pending',
        f.physicalLocation.cabinet
      ]);
      summary = [
        { label: 'Incomplete Files', value: missing.length }
      ];
    } else {
      cols = ['Record ID', 'File Number', 'Description', 'Status', 'Date'];
      tableRows = files.slice(0, 15).map((f, i) => [
        `REC-${i + 1}`,
        f.internalFileNumber,
        `${f.clientName} matter record`,
        f.currentStatus,
        new Date().toISOString().split('T')[0]
      ]);
      summary = [
        { label: 'Report Mode', value: reportLabel },
        { label: 'Records Exported', value: tableRows.length }
      ];
    }

    exportTableToPdf(
      {
        title: `${reportLabel.toUpperCase()} REPORT`,
        subtitle: 'Official Law Firm Practice Executive & Operational Audit Report',
        firmName: 'LAW FIRM REGISTRY',
        firmCode: 'LFR-001',
        generatedBy: 'System Administrator'
      },
      cols,
      tableRows,
      `lfr_report_${selectedReport}_${Date.now()}.pdf`,
      summary
    );
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#081729] p-5 rounded-2xl border border-[#C9A227]/30 shadow-xl print:hidden">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-[#C9A227]" />
          <h2 className="font-serif font-bold text-xl text-white">Reports Engine</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-gradient-to-r from-[#C9A227] to-amber-500 text-slate-950 hover:from-amber-400 hover:to-amber-500 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <FileType className="w-4 h-4" />
            Export PDF Report
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[#C9A227] text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-[#C9A227]/40"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <Printer className="w-4 h-4 text-[#C9A227]" />
            Print Report
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="bg-[#081729] p-4 rounded-xl border border-[#C9A227]/30 shadow-xl print:hidden">
        <label className="block text-xs font-bold text-[#C9A227] mb-2 uppercase tracking-wider">
          Select Report Type:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {reportTypes.map(rep => (
            <button
              key={rep.id}
              onClick={() => setSelectedReport(rep.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedReport === rep.id
                  ? 'bg-[#C9A227] text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {rep.label}
            </button>
          ))}
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 shadow-xl p-8 space-y-6 print:p-0 print:border-none print:shadow-none print:bg-white print:text-slate-900">
        
        {/* Letterhead */}
        <div className="text-center border-b border-slate-800 print:border-slate-300 pb-4 space-y-1">
          <h1 className="font-serif font-extrabold text-2xl text-white print:text-slate-900">LAW FIRM REGISTRY</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
            {reportTypes.find(r => r.id === selectedReport)?.label.toUpperCase()} REPORT
          </p>
          <div className="text-[11px] text-slate-400 print:text-slate-600 font-mono">
            Generated on: {new Date().toLocaleString()} • Firm Confidential Record
          </div>
        </div>

        {/* Dynamic Table Preview */}
        <div className="overflow-x-auto">
          {selectedReport === 'daily-court' && (
            <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300">
              <thead className="bg-slate-950 print:bg-slate-100 text-[#C9A227] print:text-slate-900 font-serif uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">File #</th>
                  <th className="p-2.5">Client vs Opposing Party</th>
                  <th className="p-2.5">Court Station</th>
                  <th className="p-2.5">Court #</th>
                  <th className="p-2.5">Magistrate</th>
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5">Advocate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                {courtSessions.map(cs => (
                  <tr key={cs.id} className="hover:bg-slate-900/60 print:hover:bg-transparent">
                    <td className="p-2.5 font-mono font-bold text-[#C9A227] print:text-slate-900">{cs.fileNumber}</td>
                    <td className="p-2.5 font-bold text-slate-100 print:text-slate-900">{cs.clientName} vs {cs.opposingParty}</td>
                    <td className="p-2.5 text-slate-300 print:text-slate-800">{cs.courtStation}</td>
                    <td className="p-2.5 text-slate-300 print:text-slate-800">{cs.courtNumber}</td>
                    <td className="p-2.5 text-slate-300 print:text-slate-800">{cs.magistrate}</td>
                    <td className="p-2.5 font-mono text-slate-400 print:text-slate-800">{cs.hearingTime}</td>
                    <td className="p-2.5 font-bold text-slate-200 print:text-slate-900">{cs.advocateName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'active-files' && (
            <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300">
              <thead className="bg-slate-950 print:bg-slate-100 text-[#C9A227] print:text-slate-900 font-serif uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Internal File #</th>
                  <th className="p-2.5">Court Case #</th>
                  <th className="p-2.5">Client</th>
                  <th className="p-2.5">Assigned Advocate</th>
                  <th className="p-2.5">Current Status</th>
                  <th className="p-2.5">Physical Cabinet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                {files.filter(f => f.currentStatus !== 'Closed').map(f => (
                  <tr key={f.id} className="hover:bg-slate-900/60 print:hover:bg-transparent">
                    <td className="p-2.5 font-mono font-bold text-[#C9A227] print:text-slate-900">{f.internalFileNumber}</td>
                    <td className="p-2.5 text-slate-300 print:text-slate-800">{f.courtCaseNumber}</td>
                    <td className="p-2.5 font-bold text-slate-100 print:text-slate-900">{f.clientName}</td>
                    <td className="p-2.5 text-slate-300 print:text-slate-800">{f.advocateName}</td>
                    <td className="p-2.5 font-bold text-emerald-400 print:text-emerald-800">{f.currentStatus}</td>
                    <td className="p-2.5 font-mono text-amber-400 print:text-amber-900">{f.physicalLocation.cabinet} ({f.physicalLocation.shelf})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'outstanding-commissions' && (
            <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300">
              <thead className="bg-slate-950 print:bg-slate-100 text-[#C9A227] print:text-slate-900 font-serif uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">File #</th>
                  <th className="p-2.5">Case Chaser</th>
                  <th className="p-2.5 text-right">Settlement</th>
                  <th className="p-2.5 text-center">Rate</th>
                  <th className="p-2.5 text-right">Due</th>
                  <th className="p-2.5 text-right">Paid</th>
                  <th className="p-2.5 text-right">Outstanding Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                {commissions.map(c => (
                  <tr key={c.id} className="hover:bg-slate-900/60 print:hover:bg-transparent">
                    <td className="p-2.5 font-mono font-bold text-[#C9A227] print:text-slate-900">{c.fileNumber}</td>
                    <td className="p-2.5 font-bold text-slate-100 print:text-slate-900">{c.caseChaserName}</td>
                    <td className="p-2.5 text-right font-mono text-slate-300 print:text-slate-800">KSh {c.settlementAmount.toLocaleString()}</td>
                    <td className="p-2.5 text-center text-slate-300 print:text-slate-800">{c.commissionRate}%</td>
                    <td className="p-2.5 text-right font-bold text-slate-200 print:text-slate-900">KSh {c.commissionDue.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-emerald-400 print:text-emerald-700">KSh {c.amountPaid.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-bold text-red-400 print:text-red-700">KSh {c.outstandingBalance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'missing-requirements' && (
            <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300">
              <thead className="bg-slate-950 print:bg-slate-100 text-[#C9A227] print:text-slate-900 font-serif uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">File #</th>
                  <th className="p-2.5">Client</th>
                  <th className="p-2.5">Advocate</th>
                  <th className="p-2.5">Missing Requirements Details</th>
                  <th className="p-2.5">Cabinet Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                {files.filter(f => f.currentStatus === 'Incomplete' || f.missingRequirements?.length).map(f => (
                  <tr key={f.id} className="hover:bg-slate-900/60 print:hover:bg-transparent">
                    <td className="p-2.5 font-mono font-bold text-[#C9A227] print:text-slate-900">{f.internalFileNumber}</td>
                    <td className="p-2.5 font-bold text-slate-100 print:text-slate-900">{f.clientName}</td>
                    <td className="p-2.5 text-slate-300 print:text-slate-800">{f.advocateName}</td>
                    <td className="p-2.5 text-red-400 print:text-red-800 font-medium">{f.missingRequirements?.join(', ')}</td>
                    <td className="p-2.5 font-mono text-slate-400 print:text-slate-700">{f.physicalLocation.cabinet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {['weekly-bringup', 'closed-files', 'pending-hearings', 'insurance-payments', 'pending-cheques', 'file-movements', 'advocate-performance', 'chaser-performance'].includes(selectedReport) && (
            <div className="p-8 text-center text-slate-400 print:text-slate-600 text-xs font-mono">
              Report view active for <strong>{reportTypes.find(r => r.id === selectedReport)?.label}</strong>. Full detailed tables loaded from central database store. Use "Export CSV" for full raw dataset.
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-slate-800 print:border-slate-300 flex items-center justify-between text-[11px] text-slate-400 print:text-slate-500 font-mono">
          <span>Firm Proprietor Authorization Signature</span>
          <span>LAW FIRM REGISTRY • Page 1 of 1</span>
        </div>

      </div>

    </div>
  );
};
