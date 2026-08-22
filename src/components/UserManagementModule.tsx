import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Unlock, 
  History, 
  Search,
  CheckCircle2,
  X,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Building2
} from 'lucide-react';
import { validatePassword } from '../utils/passwordValidator';
import { PasswordRequirementsChecklist } from './PasswordRequirementsChecklist';

interface UserManagementModuleProps {
  users: User[];
  currentUser?: User | null;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser?: (userId: string) => void;
}

export const UserManagementModule: React.FC<UserManagementModuleProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('password123');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  // New User State
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    fullName: '',
    role: 'Advocate',
    email: '',
    phone: '',
    status: 'Active'
  });

  const handleToggleSuspend = (user: User) => {
    if (user.id === currentUser?.id || (currentUser?.role === 'Proprietor' && user.id === currentUser?.id)) {
      alert('Proprietor cannot suspend their own account.');
      return;
    }
    const updatedStatus: User['status'] = user.status === 'Active' ? 'Suspended' : 'Active';
    onUpdateUser({
      ...user,
      status: updatedStatus
    });
  };

  const handleDeleteStaffAccount = (user: User) => {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own logged-in account.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Delete Staff User Account',
      message: `Are you sure you want to permanently delete the staff account for "${user.fullName}" (${user.username} - ${user.role})? This user will no longer be able to access the firm registry.`,
      confirmLabel: 'Delete Staff Account',
      onConfirm: () => {
        if (onDeleteUser) {
          onDeleteUser(user.id);
        }
        setConfirmModal(null);
      }
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset) return;

    const passCheck = validatePassword(newPassword);
    if (!passCheck.isValid) {
      alert(`Password requirement error: ${passCheck.message}`);
      return;
    }

    const updatedUser: User = {
      ...selectedUserForReset,
      password: newPassword
    };
    onUpdateUser(updatedUser);
    setResetSuccessMsg(`Password for ${selectedUserForReset.fullName} (${selectedUserForReset.username}) successfully reset to: ${newPassword}`);
    setTimeout(() => {
      setSelectedUserForReset(null);
      setResetSuccessMsg('');
    }, 2500);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.username) return;

    const userPass = formData.password?.trim() || 'Pass123!';
    const passCheck = validatePassword(userPass);
    if (!passCheck.isValid) {
      alert(`Password requirement error: ${passCheck.message}`);
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      firmId: currentUser?.firmId,
      firmCode: currentUser?.firmCode,
      firmName: currentUser?.firmName,
      username: formData.username ? formData.username.toLowerCase().trim() : (formData.email ? formData.email.trim().split('@')[0] : 'user'),
      fullName: formData.fullName.trim(),
      role: (formData.role as UserRole) || 'Advocate',
      email: formData.email ? formData.email.trim() : '',
      phone: formData.phone ? formData.phone.trim() : '',
      password: userPass,
      status: 'Active',
      lastLogin: 'Never logged in',
      permissions: ['registry_read']
    };

    onAddUser(newUser);
    setShowAddModal(false);
  };

  const filteredUsers = users.filter(u => {
    // Exclude Platform Owner / Super Admin accounts from client firm user management
    if (
      u.role === 'Super Admin' ||
      u.role === 'Platform Owner' ||
      u.username === 'superadmin' ||
      u.id === '3TVRWijWagVJBVfuTcFXCDqDzR02' ||
      u.firmCode === 'PLATFORM' ||
      u.firmId === 'platform-owner'
    ) {
      return false;
    }

    // Filter to current law firm if firmId is available
    if (currentUser?.firmId && u.firmId && u.firmId !== currentUser.firmId && currentUser.firmId !== 'platform-owner') {
      return false;
    }

    return (
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#081729] p-6 rounded-2xl border border-[#C9A227]/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[#C9A227]" />
            <h2 className="font-serif font-bold text-xl text-white">Proprietor User Management & Access Control</h2>
          </div>
          <p className="text-slate-300 text-xs mt-1">
            Add firm staff accounts, assign operational roles, grant permissions, suspend users & reset passwords.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add System User
        </button>
      </div>

      {/* Search */}
      <div className="bg-[#081729] p-4 rounded-xl border border-[#C9A227]/30 shadow-xl">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff name, username, role, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-lg focus:outline-none focus:border-[#C9A227]"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950 text-[#C9A227] font-serif uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5 pl-4">Staff Full Name</th>
                <th className="p-3.5">Username</th>
                <th className="p-3.5">Assigned Role</th>
                <th className="p-3.5">Contact Email & Phone</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5">Last Login Activity</th>
                <th className="p-3.5 pr-4 text-center">Proprietor Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-900/60 transition">
                  
                  <td className="p-3.5 pl-4 font-bold text-white">
                    {u.fullName}
                  </td>

                  <td className="p-3.5 font-mono text-[#C9A227] font-bold">
                    {u.username}
                  </td>

                  <td className="p-3.5 font-semibold text-slate-200">
                    <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                      {u.role}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <div className="text-slate-100">{u.email}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{u.phone}</div>
                  </td>

                  <td className="p-3.5">
                    {u.status === 'Active' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">Active</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-800">Suspended</span>
                    )}
                  </td>

                  <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                    {u.lastLogin}
                  </td>

                  <td className="p-3.5 pr-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedUserForReset(u)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 text-[10px] font-bold rounded border border-slate-700 transition cursor-pointer flex items-center gap-1"
                        title="Reset Password"
                      >
                        <KeyRound className="w-3 h-3 text-[#C9A227]" />
                        Reset Pass
                      </button>

                      {u.id === currentUser?.id ? (
                        <span
                          className="px-2.5 py-1 text-[10px] font-bold rounded bg-slate-900/90 border border-slate-800 text-slate-500 cursor-not-allowed flex items-center gap-1 opacity-70"
                          title="Proprietor cannot suspend own account"
                        >
                          <Lock className="w-3 h-3 text-slate-600" />
                          Self Account
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleToggleSuspend(u)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded transition cursor-pointer flex items-center gap-1 ${
                              u.status === 'Active'
                                ? 'bg-amber-950/80 text-amber-300 hover:bg-amber-900 border border-amber-800'
                                : 'bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-800'
                            }`}
                          >
                            {u.status === 'Active' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            {u.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>

                          {onDeleteUser && (
                            <button
                              onClick={() => handleDeleteStaffAccount(u)}
                              className="p-1 text-red-400 bg-red-950/60 hover:bg-red-900 border border-red-800 rounded transition cursor-pointer"
                              title="Delete staff account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      {selectedUserForReset && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-2xl max-w-sm w-full p-6 space-y-4 border border-[#C9A227]/40 shadow-2xl text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-serif font-bold text-base text-white">Proprietor Password Reset</h3>
              <button onClick={() => setSelectedUserForReset(null)} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSuccessMsg ? (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-lg font-medium">
                {resetSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Target User</div>
                  <div className="font-bold text-white text-sm">{selectedUserForReset.fullName}</div>
                  <div className="text-[11px] text-[#C9A227] font-mono">Username: {selectedUserForReset.username}</div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">New Secure Password</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-mono font-bold text-sm focus:border-[#C9A227]"
                  />
                </div>

                <PasswordRequirementsChecklist password={newPassword} />

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForReset(null)}
                    className="px-4 py-1.5 border border-slate-700 rounded text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold rounded"
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#C9A227]/40 shadow-2xl text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-serif font-bold text-base text-white">Add System User Account</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              
              <div>
                <label className="block font-bold text-slate-300 mb-1">Staff Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adv. John Wambua"
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
                    placeholder="e.g. wambua"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-mono focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Role Assignment</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-bold focus:border-[#C9A227]"
                  >
                    <option value="Proprietor" className="bg-slate-900">Proprietor</option>
                    <option value="Advocate" className="bg-slate-900">Advocate</option>
                    <option value="Secretary" className="bg-slate-900">Secretary</option>
                    <option value="Clerk" className="bg-slate-900">Clerk</option>
                    <option value="Case Chaser" className="bg-slate-900">Case Chaser</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Email Address (Login Credential)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. wambua@lawfirm.co.ke"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Account Password</label>
                <input
                  type="password"
                  placeholder="Set password (default: Pass123!)"
                  value={formData.password || ''}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-mono focus:border-[#C9A227]"
                />
              </div>

              <PasswordRequirementsChecklist password={formData.password || 'Pass123!'} />

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
                  className="px-4 py-1.5 border border-slate-700 rounded text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold rounded"
                >
                  Create Account
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#081729] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-serif font-bold text-lg text-white">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {confirmModal.confirmLabel || 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
