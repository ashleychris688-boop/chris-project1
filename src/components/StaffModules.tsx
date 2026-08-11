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
  Building,
  UserPlus,
  X
} from 'lucide-react';

interface StaffModuleProps {
  files: RegistryFile[];
  users: User[];
  roleFilter: 'Advocate' | 'Secretary' | 'Clerk' | 'Case Chaser';
  currentUser?: User | null;
  onAddUser?: (user: User) => void;
}

export const StaffModules: React.FC<StaffModuleProps> = ({
  files,
  users,
  roleFilter,
  currentUser,
  onAddUser
}) => {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<User>>({
    username: '',
    fullName: '',
    role: roleFilter,
    email: '',
    phone: '',
    status: 'Active'
  });

  const isProprietorOrAdmin = currentUser?.role === 'Proprietor' || currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  const staffMembers = users.filter(u => u.role === roleFilter);

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.username) return;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      firmId: currentUser?.firmId,
      firmCode: currentUser?.firmCode,
      firmName: currentUser?.firmName,
      username: formData.username ? formData.username.toLowerCase().trim() : (formData.email ? formData.email.trim().split('@')[0] : 'user'),
      fullName: formData.fullName.trim(),
      role: (formData.role as any) || roleFilter,
      email: formData.email ? formData.email.trim() : '',
      phone: formData.phone ? formData.phone.trim() : '',
      password: formData.password || 'password123',
      status: 'Active',
      lastLogin: 'Never logged in',
      permissions: ['registry_read']
    };

    if (onAddUser) {
      onAddUser(newUser);
    }
    setShowAddModal(false);
    setFormData({
      username: '',
      fullName: '',
      role: roleFilter,
      email: '',
      phone: '',
      status: 'Active'
    });
  };

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

        {isProprietorOrAdmin && (
          <button
            onClick={() => {
              setFormData({
                username: '',
                fullName: '',
                role: roleFilter,
                email: '',
                phone: '',
                status: 'Active'
              });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Add New {roleFilter}
          </button>
        )}
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

      {/* Add Staff User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#C9A227]/40 shadow-2xl text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-serif font-bold text-base text-white">Add New {roleFilter} Account</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              
              <div>
                <label className="block font-bold text-slate-300 mb-1">Staff Full Name</label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${roleFilter === 'Advocate' ? 'Adv. John Wambua' : roleFilter === 'Secretary' ? 'Jane Wanjiku' : roleFilter === 'Clerk' ? 'James Mwangi' : 'David Kiprop'}`}
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. jwambua"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-mono focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Role Assignment</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-bold focus:border-[#C9A227]"
                  >
                    <option value="Advocate" className="bg-slate-900">Advocate</option>
                    <option value="Secretary" className="bg-slate-900">Secretary</option>
                    <option value="Clerk" className="bg-slate-900">Clerk</option>
                    <option value="Case Chaser" className="bg-slate-900">Case Chaser</option>
                    <option value="Proprietor" className="bg-slate-900">Proprietor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. staff@lawfirm.co.ke"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Account Password</label>
                <input
                  type="password"
                  placeholder="Set password (default: password123)"
                  value={formData.password || ''}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-mono focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+254 700 000000"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-mono focus:border-[#C9A227]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 border border-slate-700 rounded text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold rounded cursor-pointer"
                >
                  Create Account
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
