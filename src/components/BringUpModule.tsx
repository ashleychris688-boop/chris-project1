import React, { useState } from 'react';
import { BringUpItem } from '../types';
import { 
  ListOrdered, 
  Printer, 
  Download, 
  CheckCircle2, 
  Circle, 
  MapPin, 
  Calendar, 
  FileText, 
  CheckSquare,
  Sparkles
} from 'lucide-react';

interface BringUpModuleProps {
  bringUpItems: BringUpItem[];
  onToggleRetrieved: (id: string) => void;
}

export const BringUpModule: React.FC<BringUpModuleProps> = ({
  bringUpItems,
  onToggleRetrieved
}) => {
  const [filterStation, setFilterStation] = useState<string>('ALL');

  // Grouping logic: Group 1: Court Station -> Group 2: Court Number -> Group 3: Hearing Date
  const groupedData: Record<string, Record<string, Record<string, BringUpItem[]>>> = {};

  bringUpItems.forEach(item => {
    if (filterStation !== 'ALL' && item.courtStation !== filterStation) return;

    if (!groupedData[item.courtStation]) groupedData[item.courtStation] = {};
    if (!groupedData[item.courtStation][item.courtNumber]) groupedData[item.courtStation][item.courtNumber] = {};
    if (!groupedData[item.courtStation][item.courtNumber][item.hearingDate]) {
      groupedData[item.courtStation][item.courtNumber][item.hearingDate] = [];
    }

    groupedData[item.courtStation][item.courtNumber][item.hearingDate].push(item);
  });

  const handlePrint = () => {
    window.print();
  };

  const stations = Array.from(new Set(bringUpItems.map(i => i.courtStation)));

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#081729] p-6 rounded-2xl border border-[#C9A227]/30 shadow-xl print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <ListOrdered className="w-6 h-6 text-[#C9A227]" />
            <h2 className="font-serif font-bold text-xl text-white">Automated Friday Bring-Up List</h2>
          </div>
          <p className="text-slate-300 text-xs mt-1">
            Generated every Friday for registry clerks. Grouped by Court Station, Court Number, Hearing Date, Case Type & File Number.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            Print Registry Retrieval Sheet
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#081729] p-4 rounded-xl border border-[#C9A227]/30 shadow-xl flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#C9A227]">Filter Court Station:</span>
          <select
            value={filterStation}
            onChange={e => setFilterStation(e.target.value)}
            className="p-1.5 bg-slate-950 border border-slate-700 text-slate-100 rounded text-xs font-semibold focus:border-[#C9A227]"
          >
            <option value="ALL" className="bg-slate-900">All Stations</option>
            {stations.map(st => (
              <option key={st} value={st} className="bg-slate-900">{st}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Items Total: {bringUpItems.length} • Retrieved: {bringUpItems.filter(i => i.retrieved).length}
        </div>
      </div>

      {/* Printable Bring-Up List Layout */}
      <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 shadow-xl p-8 space-y-8 print:bg-white print:text-slate-900 print:p-0 print:border-none print:shadow-none">
        
        {/* Printable Letterhead */}
        <div className="text-center border-b border-slate-800 print:border-slate-300 pb-6 space-y-1">
          <h1 className="font-serif font-extrabold text-2xl text-white print:text-[#0B1F3A]">LAW FIRM REGISTRY</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227]">
            REGISTRY FRIDAY BRING-UP PHYSICAL FILE RETRIEVAL LIST
          </p>
          <p className="text-xs text-slate-400 print:text-slate-500 font-mono">
            For Week Commencing: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Grouped Structure */}
        {Object.keys(groupedData).length > 0 ? (
          Object.entries(groupedData).map(([station, courtMap]) => (
            <div key={station} className="space-y-6">
              
              {/* Level 1: Court Station Heading */}
              <div className="bg-slate-950 text-[#C9A227] px-4 py-2 rounded-lg font-serif font-bold text-sm uppercase flex items-center gap-2 border border-slate-800 print:bg-[#0B1F3A] print:text-[#C9A227]">
                <MapPin className="w-4 h-4 text-[#C9A227]" />
                1. COURT STATION: {station}
              </div>

              {Object.entries(courtMap).map(([courtNo, dateMap]) => (
                <div key={courtNo} className="pl-4 space-y-4">
                  
                  {/* Level 2: Court Number */}
                  <div className="text-xs font-bold text-slate-200 print:text-[#0B1F3A] uppercase tracking-wider border-b border-slate-800 print:border-slate-300 pb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C9A227]"></span>
                    2. COURT NUMBER: {courtNo}
                  </div>

                  {Object.entries(dateMap).map(([date, items]) => (
                    <div key={date} className="pl-4 space-y-2">
                      
                      {/* Level 3: Hearing Date */}
                      <div className="text-xs font-semibold text-slate-300 print:text-slate-600 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-[#C9A227]" />
                        3. HEARING DATE: {date}
                      </div>

                      {/* Items Table */}
                      <div className="overflow-x-auto border border-slate-800 print:border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-200 font-bold border-b border-slate-800 print:bg-slate-100 print:text-slate-800">
                            <tr>
                              <th className="p-2.5 w-10 text-center print:hidden">Check</th>
                              <th className="p-2.5 font-mono">Internal File #</th>
                              <th className="p-2.5">Case Type</th>
                              <th className="p-2.5">Client vs Opposing Party</th>
                              <th className="p-2.5">Advocate</th>
                              <th className="p-2.5">Current Physical Shelf</th>
                              <th className="p-2.5">Retrieval Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                            {items.map(item => (
                              <tr key={item.id} className={`hover:bg-slate-900/60 ${item.retrieved ? 'bg-emerald-950/30' : ''}`}>
                                
                                <td className="p-2.5 text-center print:hidden">
                                  <button
                                    onClick={() => onToggleRetrieved(item.id)}
                                    className="hover:scale-110 transition cursor-pointer"
                                  >
                                    {item.retrieved ? (
                                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-slate-600" />
                                    )}
                                  </button>
                                </td>

                                <td className="p-2.5 font-mono font-extrabold text-[#C9A227]">
                                  {item.fileNumber}
                                </td>

                                <td className="p-2.5 text-slate-300 font-medium">
                                  {item.caseType}
                                </td>

                                <td className="p-2.5 font-bold text-white print:text-slate-900">
                                  {item.clientName} <span className="text-slate-400 print:text-slate-500 font-normal">vs {item.opposingParty}</span>
                                </td>

                                <td className="p-2.5 text-slate-200 print:text-slate-800">
                                  {item.advocateName}
                                </td>

                                <td className="p-2.5 font-mono text-amber-300 bg-amber-950/60 font-bold rounded border border-amber-800/60">
                                  {item.currentLocation}
                                </td>

                                <td className="p-2.5">
                                  {item.retrieved ? (
                                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                                      RETRIEVED ({item.retrievedBy})
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                                      PENDING RETRIEVAL
                                    </span>
                                  )}
                                </td>

                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  ))}

                </div>
              ))}

            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No bring-up items found for this filter.
          </div>
        )}

        {/* Signature Line for Print */}
        <div className="pt-8 border-t border-slate-800 print:border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-300 print:text-slate-700">
          <div>
            <div className="font-bold text-white print:text-[#0B1F3A]">Registry Clerk Signature:</div>
            <div className="border-b border-slate-700 print:border-slate-400 h-10 mb-1"></div>
            <div className="text-[10px] text-slate-400 print:text-slate-500">Name & Date</div>
          </div>
          <div>
            <div className="font-bold text-white print:text-[#0B1F3A]">Advocate Handover Confirmation:</div>
            <div className="border-b border-slate-700 print:border-slate-400 h-10 mb-1"></div>
            <div className="text-[10px] text-slate-400 print:text-slate-500">Signature & Date</div>
          </div>
        </div>

      </div>

    </div>
  );
};
