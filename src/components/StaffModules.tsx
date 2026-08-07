import React from 'react';
import { RegistryFile, User } from '../types';
import { 
  Gavel, 
  UserSquare2, 
  FileSpreadsheet, 
  Handshake, 
  FolderArchive, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail, 
  Award,
  Building
} from 'lucide-react';

interface StaffModuleProps {
  files: RegistryFile[];
  users: User[];
  roleFilter: 'Advocate' | 'Secretary' | 'Clerk' | 'Case Chaser';
}

export const StaffModules: React.FC<StaffModuleProps> = ({
  files,
  users,
  roleFilter
}) => {
  const staffMembers = users.filter(u => u.role === roleFilter);

  const getRoleIcon = () => {
    switch (roleFilter) {
      case 'Advocate': return Gavel;
      case 'Secretary': return UserSquare2;
      case 'Clerk': return FileSpreadsheet;
      case 'Case Chaser': return Handshake;
    }
  };

  const Icon = getRoleIcon();

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#081729] p-6 rounded-2xl border border-[#C9A227]/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="w-6 h-6 text-[#C9A227]" />
            <h2 className="font-serif font-bold text-xl text-white">
              Firm Directory — {roleFilter}s Register
            </h2>
          </div>
          <p className="text-slate-300 text-xs mt-1">
            Overview of active staff, assigned physical litigation files & operational performance metrics.
          </p>
        </div>
      </div>

      {/* Staff Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffMembers.map(staff => {
          
          // Count active assigned files
          const assignedFiles = files.filter(f => {
            if (roleFilter === 'Advocate') return f.advocateName.includes(staff.fullName.split(' ')[1] || staff.fullName);
            if (roleFilter === 'Secretary') return f.secretaryName.includes(staff.fullName.split(' ')[0] || staff.fullName);
            if (roleFilter === 'Clerk') return f.clerkName.includes(staff.fullName.split(' ')[0] || staff.fullName);
            if (roleFilter === 'Case Chaser') return f.caseChaserName.includes(staff.fullName.split(' ')[0] || staff.fullName);
            return false;
          });

          return (
            <div key={staff.id} className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 p-6 shadow-xl space-y-4">
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-[#C9A227] text-[#C9A227] flex items-center justify-center font-serif font-bold text-lg">
                  {staff.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-white">{staff.fullName}</h3>
                  <div className="text-xs text-[#C9A227] font-semibold">{staff.role}</div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300 border-t border-b border-slate-800 py-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>{staff.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>{staff.phone}</span>
                </div>
              </div>

              {/* Assigned Files Metric */}
              <div className="p-3 bg-slate-900 rounded-xl space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>Assigned Physical Files</span>
                  <span className="font-mono text-[#C9A227] text-sm">{assignedFiles.length}</span>
                </div>

                <div className="space-y-1">
                  {assignedFiles.slice(0, 3).map(af => (
                    <div key={af.id} className="text-[11px] text-slate-200 flex items-center justify-between font-mono bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="font-bold text-[#C9A227]">{af.internalFileNumber}</span>
                      <span className="truncate text-slate-400 max-w-[120px]">{af.clientName}</span>
                    </div>
                  ))}
                  {assignedFiles.length > 3 && (
                    <div className="text-[10px] text-slate-400 text-center italic">
                      + {assignedFiles.length - 3} more assigned files
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Status: <strong className="text-emerald-400">{staff.status}</strong></span>
                <span>Last login: {staff.lastLogin}</span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
