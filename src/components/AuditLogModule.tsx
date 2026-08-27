import React, { useState } from 'react';
import { AuditLogEntry } from '../types';
import { 
  History, 
  Search, 
  ShieldCheck, 
  Clock, 
  User, 
  Filter,
  FileText
} from 'lucide-react';

interface AuditLogModuleProps {
  logs: AuditLogEntry[];
}

export const AuditLogModule: React.FC<AuditLogModuleProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const categories = ['ALL', 'Registry', 'Movement', 'Court', 'Insurance', 'Commission', 'User', 'Settings', 'Auth'];

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || l.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#081729] p-5 rounded-2xl border border-[#C9A227]/30 shadow-xl">
        <div className="flex items-center gap-2.5">
          <History className="w-6 h-6 text-[#C9A227]" />
          <h2 className="font-serif font-bold text-xl text-white">System Security Audit Trail</h2>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#081729] p-4 rounded-xl border border-[#C9A227]/30 shadow-xl">
        
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, staff member, details..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-lg focus:outline-none focus:border-[#C9A227]"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#C9A227] text-slate-950 font-bold shadow'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Audit Log Table */}
      <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950 text-[#C9A227] font-serif uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5 pl-4">Timestamp</th>
                <th className="p-3.5">User Member & Role</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Action Executed</th>
                <th className="p-3.5 pr-4">Details & Target Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-900/60 transition">
                  
                  <td className="p-3.5 pl-4 font-bold text-slate-300 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#C9A227]" />
                      {log.timestamp}
                    </div>
                  </td>

                  <td className="p-3.5 font-sans">
                    <div className="font-bold text-white">{log.user}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.role}</div>
                  </td>

                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-bold text-[#C9A227]">
                      {log.category}
                    </span>
                  </td>

                  <td className="p-3.5 font-sans font-bold text-slate-100">
                    {log.action}
                  </td>

                  <td className="p-3.5 pr-4 font-sans text-slate-300 leading-relaxed max-w-md">
                    {log.details}
                  </td>

                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs font-sans">
                    No audit trail logs found matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
