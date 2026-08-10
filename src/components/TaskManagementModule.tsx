import React, { useState, useMemo } from 'react';
import { isWeekend, ensureWeekday } from '../utils/dateUtils';
import { 
  TaskItem, 
  TaskPriority, 
  TaskStatus, 
  TaskCategory, 
  User, 
  RegistryFile, 
  UserRole 
} from '../types';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Calendar, 
  Tag, 
  Briefcase, 
  LayoutGrid, 
  List, 
  Eye, 
  Sparkles, 
  ChevronRight, 
  Repeat, 
  ArrowUpDown, 
  ShieldCheck, 
  FileText, 
  History, 
  X,
  Bell,
  BarChart2,
  PieChart,
  User as UserIcon,
  FolderArchive,
  Award,
  Building,
  MapPin,
  Scale
} from 'lucide-react';

interface TaskManagementModuleProps {
  currentUser: User | null;
  users: User[];
  files: RegistryFile[];
  tasks: TaskItem[];
  onAddTask: (task: TaskItem) => void;
  onUpdateTask: (task: TaskItem) => void;
  onDeleteTask?: (taskId: string) => void;
  onNavigateToFile?: (fileNumber: string) => void;
}

// Preset Task Suggestions grouped by Assigner / Assignee Role & Domain
const PRESET_TASK_SUGGESTIONS: Record<string, Array<{ title: string; category: TaskCategory }>> = {
  Proprietor_Legal: [
    { title: 'Attend Court Hearing', category: 'Court' },
    { title: 'Prepare for Trial Hearing', category: 'Legal' },
    { title: 'Draft Pleadings & Affidavit', category: 'Legal' },
    { title: 'Draft Submissions', category: 'Legal' },
    { title: 'Draft Demand Letter', category: 'Legal' },
    { title: 'Review Case File Quantum', category: 'Legal' },
    { title: 'Review Court Judgment', category: 'Legal' },
    { title: 'Review Insurance Offer', category: 'Insurance' },
    { title: 'Negotiate Out-of-Court Settlement', category: 'Legal' },
    { title: 'Prepare Formal Legal Opinion', category: 'Legal' },
    { title: 'Attend Court Mediation Session', category: 'Court' },
    { title: 'Meet Client for Consultation', category: 'Client' }
  ],
  Proprietor_Registry: [
    { title: 'Register New File in System', category: 'Registry' },
    { title: 'Approve & Sanction New File', category: 'Registry' },
    { title: 'Generate File Number', category: 'Registry' },
    { title: 'Retrieve Physical File from Cabinet', category: 'Registry' },
    { title: 'Return Physical File to Shelf', category: 'Registry' },
    { title: 'Archive Inactive File', category: 'Registry' },
    { title: 'Generate Weekly Upcoming List', category: 'Registry' },
    { title: 'Update Registry Log', category: 'Registry' }
  ],
  Advocate_Clerk: [
    { title: 'File Court Documents at Registry', category: 'Court' },
    { title: 'Extract Court Order / Decree', category: 'Court' },
    { title: 'Collect Certified Ruling Copies', category: 'Court' },
    { title: 'Pay Court Filing Fees', category: 'Financial' },
    { title: 'Serve Court Documents on Defendant', category: 'Court' },
    { title: 'Retrieve Physical File for Advocate', category: 'Registry' },
    { title: 'Return File to Storage Cabinet', category: 'Registry' },
    { title: 'Update Court Cause List & Diary', category: 'Court' },
    { title: 'Confirm Court Hearing Date with Registry', category: 'Court' },
    { title: 'Print Pleadings & Bundle for Hearing', category: 'Administrative' },
    { title: 'Schedule Client Meeting in Diary', category: 'Client' }
  ],
  Advocate_Chaser: [
    { title: 'Follow Up Client for Documents', category: 'Follow-Up' },
    { title: 'Obtain Police Abstract from Station', category: 'Follow-Up' },
    { title: 'Obtain Medical P3 Report from Hospital', category: 'Follow-Up' },
    { title: 'Obtain Signed Witness Statements', category: 'Follow-Up' },
    { title: 'Collect Original Medical Receipts', category: 'Financial' },
    { title: 'Visit Insurance Company Claims Desk', category: 'Insurance' },
    { title: 'Confirm Client Availability for Hearing', category: 'Client' },
    { title: 'Collect Additional Evidence / Photos', category: 'Follow-Up' },
    { title: 'Deliver Urgent Demand Letter', category: 'Client' }
  ],
  Clerk_Advocate: [
    { title: 'Attend Urgent Court Mention', category: 'Court' },
    { title: 'Review Returned Physical File', category: 'Registry' },
    { title: 'Sign Pleadings & Supporting Affidavit', category: 'Legal' },
    { title: 'Meet Walk-in Client in Office', category: 'Client' },
    { title: 'Review Insurance Settlement Proposal', category: 'Insurance' },
    { title: 'Approve Outgoing Formal Correspondence', category: 'Administrative' }
  ],
  Clerk_Chaser: [
    { title: 'Contact Client for Missing ID / KRA', category: 'Client' },
    { title: 'Collect Missing Intake Documents', category: 'Follow-Up' },
    { title: 'Obtain Certified Police Abstract', category: 'Follow-Up' },
    { title: 'Obtain Treatment Notes & Doctor Report', category: 'Follow-Up' },
    { title: 'Confirm Client Appointment with Clerk', category: 'Client' },
    { title: 'Deliver Documents to External Adjuster', category: 'Insurance' },
    { title: 'Visit Insurance Office for Cheque Status', category: 'Insurance' }
  ]
};

export const TaskManagementModule: React.FC<TaskManagementModuleProps> = ({
  currentUser,
  users,
  files,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onNavigateToFile
}) => {
  const currentRole = currentUser?.role || 'Proprietor';
  const isProprietor = currentRole === 'Proprietor' || currentRole === 'Admin';
  const isAdvocate = currentRole === 'Advocate';
  const isClerkOrSecretary = currentRole === 'Clerk' || currentRole === 'Secretary';
  const isCaseChaser = currentRole === 'Case Chaser';

  // State management
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');
  const [courtStationFilter, setCourtStationFilter] = useState<string>('All');
  const [quickDateFilter, setQuickDateFilter] = useState<'all' | 'today' | 'week' | 'overdue' | 'my_tasks'>('all');

  // Modal file selector state
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [fileStatusFilterModal, setFileStatusFilterModal] = useState<'All' | 'Active' | 'Closed'>('All');
  const [selectedFileObj, setSelectedFileObj] = useState<RegistryFile | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<TaskItem | null>(null);
  const [showFileModal, setShowFileModal] = useState<RegistryFile | null>(null);

  // Completion / Verification Forms
  const [completionNotesInput, setCompletionNotesInput] = useState('');
  const [verificationNotesInput, setVerificationNotesInput] = useState('');

  // New Task Form State
  const [newTask, setNewTask] = useState<{
    fileNumber: string;
    taskCategory: TaskCategory;
    taskTitle: string;
    description: string;
    assignedTo: string;
    assignedToRole: UserRole;
    priority: TaskPriority;
    dueDate: string;
    dueTime: string;
    isRecurring: boolean;
    recurringInterval: 'Weekly' | 'Monthly' | 'Routine' | 'Daily';
  }>({
    fileNumber: '',
    taskCategory: 'Legal',
    taskTitle: '',
    description: '',
    assignedTo: '',
    assignedToRole: 'Clerk',
    priority: 'Medium',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    dueTime: '17:00',
    isRecurring: false,
    recurringInterval: 'Weekly'
  });

  // Unique list of Court Stations from files and tasks for filter dropdown
  const availableCourtStations = useMemo(() => {
    const set = new Set<string>();
    files.forEach(f => { if (f.courtStation) set.add(f.courtStation); });
    tasks.forEach(t => { if (t.courtStation) set.add(t.courtStation); });
    return Array.from(set);
  }, [files, tasks]);

  // Filtered files for the task assignment search box
  const filteredFilesForModal = useMemo(() => {
    return files.filter(f => {
      if (fileStatusFilterModal === 'Active' && f.currentStatus === 'Closed') return false;
      if (fileStatusFilterModal === 'Closed' && f.currentStatus !== 'Closed') return false;

      if (!fileSearchQuery.trim()) return true;

      const q = fileSearchQuery.toLowerCase();
      return (
        f.internalFileNumber.toLowerCase().includes(q) ||
        (f.courtCaseNumber && f.courtCaseNumber.toLowerCase().includes(q)) ||
        f.clientName.toLowerCase().includes(q) ||
        (f.opposingParty && f.opposingParty.toLowerCase().includes(q)) ||
        (f.courtStation && f.courtStation.toLowerCase().includes(q)) ||
        (f.currentStatus && f.currentStatus.toLowerCase().includes(q))
      );
    });
  }, [files, fileSearchQuery, fileStatusFilterModal]);

  // Calculate user assignment permissions based on role
  const assignableUsers = useMemo(() => {
    if (isProprietor) {
      return users; // Proprietor can assign to ANY user
    }
    if (isAdvocate) {
      return users.filter(u => u.role === 'Clerk' || u.role === 'Secretary' || u.role === 'Case Chaser');
    }
    if (isClerkOrSecretary) {
      return users.filter(u => u.role === 'Advocate' || u.role === 'Case Chaser' || u.role === 'Secretary' || u.role === 'Clerk');
    }
    return []; // Case Chasers cannot assign tasks
  }, [users, isProprietor, isAdvocate, isClerkOrSecretary]);

  // Set default assigned user when opening create modal
  const handleOpenCreateModal = () => {
    if (isCaseChaser) {
      alert("Case Chasers cannot assign new tasks.");
      return;
    }
    const defaultAssignee = assignableUsers[0];
    setFileSearchQuery('');
    setFileStatusFilterModal('All');
    setSelectedFileObj(null);
    setNewTask(prev => ({
      ...prev,
      fileNumber: '',
      assignedTo: defaultAssignee ? defaultAssignee.fullName : '',
      assignedToRole: defaultAssignee ? defaultAssignee.role : 'Clerk'
    }));
    setShowCreateModal(true);
  };

  // Helper date calculation
  const todayStr = new Date().toISOString().split('T')[0];

  // Process tasks with Overdue auto-tagging
  const processedTasks = useMemo(() => {
    return tasks.map(t => {
      let currentStatus = t.status;
      // Auto flag as overdue if pending/in progress and due date < today
      if (
        (currentStatus === 'Pending' || currentStatus === 'In Progress') &&
        t.dueDate < todayStr
      ) {
        currentStatus = 'Overdue';
      }
      return {
        ...t,
        status: currentStatus
      };
    });
  }, [tasks, todayStr]);

  // Filtered Tasks with Court Case, Parties & Court Station search
  const filteredTasks = useMemo(() => {
    return processedTasks.filter(task => {
      const relatedFile = files.find(f => (task.fileNumber && f.internalFileNumber === task.fileNumber) || (task.fileId && f.id === task.fileId));
      const displayCourtCase = task.courtCaseNumber || relatedFile?.courtCaseNumber || '';
      const displayStation = task.courtStation || relatedFile?.courtStation || '';
      const displayOpposing = task.opposingParty || relatedFile?.opposingParty || '';
      const displayClient = task.clientName || relatedFile?.clientName || '';
      const displayFileStatus = task.fileStatus || relatedFile?.currentStatus || '';

      // Search term checks title, description, file number, court case number, parties, court station, assignee & assigner
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        !term ||
        task.taskTitle.toLowerCase().includes(term) ||
        (task.description && task.description.toLowerCase().includes(term)) ||
        (task.fileNumber && task.fileNumber.toLowerCase().includes(term)) ||
        displayClient.toLowerCase().includes(term) ||
        displayCourtCase.toLowerCase().includes(term) ||
        displayStation.toLowerCase().includes(term) ||
        displayOpposing.toLowerCase().includes(term) ||
        displayFileStatus.toLowerCase().includes(term) ||
        task.assignedTo.toLowerCase().includes(term) ||
        task.assignedBy.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      // Status
      if (statusFilter !== 'All' && task.status !== statusFilter) return false;

      // Category
      if (categoryFilter !== 'All' && task.taskCategory !== categoryFilter) return false;

      // Priority
      if (priorityFilter !== 'All' && task.priority !== priorityFilter) return false;

      // Assignee
      if (assigneeFilter !== 'All' && task.assignedTo !== assigneeFilter) return false;

      // Court Station Filter
      if (courtStationFilter !== 'All' && displayStation !== courtStationFilter) return false;

      // Quick Date Filter
      if (quickDateFilter === 'my_tasks' && currentUser) {
        if (task.assignedTo.toLowerCase() !== currentUser.fullName.toLowerCase()) return false;
      } else if (quickDateFilter === 'today') {
        if (task.dueDate !== todayStr) return false;
      } else if (quickDateFilter === 'week') {
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        if (task.dueDate < todayStr || task.dueDate > nextWeek) return false;
      } else if (quickDateFilter === 'overdue') {
        if (task.status !== 'Overdue') return false;
      }

      return true;
    });
  }, [processedTasks, files, searchTerm, statusFilter, categoryFilter, priorityFilter, assigneeFilter, courtStationFilter, quickDateFilter, currentUser, todayStr]);

  // Dashboard Metrics
  const metrics = useMemo(() => {
    const total = processedTasks.length;
    const pending = processedTasks.filter(t => t.status === 'Pending').length;
    const inProgress = processedTasks.filter(t => t.status === 'In Progress').length;
    const awaitingVerification = processedTasks.filter(t => t.status === 'Awaiting Verification').length;
    const completed = processedTasks.filter(t => t.status === 'Completed').length;
    const overdue = processedTasks.filter(t => t.status === 'Overdue').length;
    const dueToday = processedTasks.filter(t => t.dueDate === todayStr && t.status !== 'Completed' && t.status !== 'Cancelled').length;
    const myPending = currentUser ? processedTasks.filter(t => t.assignedTo.toLowerCase() === currentUser.fullName.toLowerCase() && (t.status === 'Pending' || t.status === 'In Progress' || t.status === 'Overdue')).length : 0;

    return {
      total,
      pending,
      inProgress,
      awaitingVerification,
      completed,
      overdue,
      dueToday,
      myPending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [processedTasks, todayStr, currentUser]);

  // Proprietor specific Analytics Breakdown
  const userTaskBreakdown = useMemo<Record<string, { total: number; completed: number; pending: number; overdue: number }>>(() => {
    const map: Record<string, { total: number; completed: number; pending: number; overdue: number }> = {};
    processedTasks.forEach(t => {
      const u = t.assignedTo;
      if (!map[u]) map[u] = { total: 0, completed: 0, pending: 0, overdue: 0 };
      map[u].total += 1;
      if (t.status === 'Completed') map[u].completed += 1;
      else if (t.status === 'Overdue') map[u].overdue += 1;
      else map[u].pending += 1;
    });
    return map;
  }, [processedTasks]);

  // Notifications for Current User
  const notifications = useMemo(() => {
    if (!currentUser) return [];
    const name = currentUser.fullName.toLowerCase();
    const alerts: Array<{ id: string; type: 'urgent' | 'warning' | 'info' | 'success'; message: string }> = [];

    processedTasks.forEach(t => {
      const isMine = t.assignedTo.toLowerCase() === name;
      const isIassigned = t.assignedBy.toLowerCase() === name;

      if (isMine && t.status === 'Overdue') {
        alerts.push({
          id: `notif-ovd-${t.id}`,
          type: 'urgent',
          message: `OVERDUE TASK: "${t.taskTitle}" (File: ${t.fileNumber || 'General'}) was due on ${t.dueDate}.`
        });
      } else if (isMine && t.dueDate === todayStr && t.status !== 'Completed') {
        alerts.push({
          id: `notif-[#C9A227]-${t.id}`,
          type: 'warning',
          message: `DUE TODAY: "${t.taskTitle}" assigned by ${t.assignedBy} requires action.`
        });
      } else if (isIassigned && t.status === 'Awaiting Verification') {
        alerts.push({
          id: `notif-[#C9A227]-v-${t.id}`,
          type: 'info',
          message: `AWAITING VERIFICATION: ${t.assignedTo} completed "${t.taskTitle}". Please review & verify.`
        });
      }
    });

    return alerts.slice(0, 4); // limit to top 4 alerts
  }, [processedTasks, currentUser, todayStr]);

  // Form Submit Handler for Creating Task
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!newTask.taskTitle.trim()) {
      alert("Please enter a task title.");
      return;
    }

    const assignedUser = users.find(u => u.fullName === newTask.assignedTo);
    const relatedFile = files.find(f => f.internalFileNumber === newTask.fileNumber);

    const taskId = `TSK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const item: TaskItem = {
      id: taskId,
      fileNumber: newTask.fileNumber || undefined,
      fileId: relatedFile?.id,
      clientName: relatedFile?.clientName,
      taskCategory: newTask.taskCategory,
      taskTitle: newTask.taskTitle,
      description: newTask.description,
      assignedBy: currentUser.fullName,
      assignedByRole: currentUser.role,
      assignedTo: newTask.assignedTo,
      assignedToRole: assignedUser ? assignedUser.role : newTask.assignedToRole,
      assignedToChaserName: newTask.assignedTo,
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      dueTime: newTask.dueTime,
      status: 'Pending',
      dateAssigned: new Date().toISOString().split('T')[0],
      verificationStatus: 'Unverified',
      isRecurring: newTask.isRecurring,
      recurringInterval: newTask.isRecurring ? newTask.recurringInterval : undefined,
      createdDate: new Date().toISOString().split('T')[0]
    };

    onAddTask(item);
    setShowCreateModal(false);
    setNewTask({
      fileNumber: '',
      taskCategory: 'Legal',
      taskTitle: '',
      description: '',
      assignedTo: assignableUsers[0]?.fullName || '',
      assignedToRole: assignableUsers[0]?.role || 'Clerk',
      priority: 'Medium',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      dueTime: '17:00',
      isRecurring: false,
      recurringInterval: 'Weekly'
    });
  };

  // Status Change Handler
  const handleStatusChange = (task: TaskItem, newStatus: TaskStatus) => {
    if (!currentUser) return;

    let updated: TaskItem = { ...task, status: newStatus };

    // If changing to Completed
    if (newStatus === 'Completed') {
      updated.dateCompleted = new Date().toISOString().split('T')[0];
      // If completed by someone other than assigner or if assigner needs verification:
      if (task.assignedBy !== currentUser.fullName) {
        updated.status = 'Awaiting Verification';
        updated.verificationStatus = 'Unverified';
      } else {
        updated.verificationStatus = 'Verified';
        updated.verifiedBy = currentUser.fullName;
        updated.verifiedDate = new Date().toISOString().split('T')[0];
      }
    }

    onUpdateTask(updated);
    if (selectedTaskDetails?.id === task.id) {
      setSelectedTaskDetails(updated);
    }
  };

  // Verification Handler (Assigner or Proprietor Approves / Rejects)
  const handleVerifyTask = (task: TaskItem, decision: 'approve' | 'reject') => {
    if (!currentUser) return;

    let updated: TaskItem = { ...task };
    if (decision === 'approve') {
      updated.status = 'Completed';
      updated.verificationStatus = 'Verified';
      updated.verifiedBy = currentUser.fullName;
      updated.verifiedDate = new Date().toISOString().split('T')[0];
      updated.verificationNotes = verificationNotesInput || 'Verified & approved by assigner.';
    } else {
      updated.status = 'In Progress'; // Send back for revision
      updated.verificationStatus = 'Rejected';
      updated.verificationNotes = verificationNotesInput || 'Rejected. Please revise based on requirements.';
    }

    onUpdateTask(updated);
    setSelectedTaskDetails(updated);
    setVerificationNotesInput('');
  };

  // Preset Selection Helper
  const applyPresetSuggestion = (suggestion: { title: string; category: TaskCategory }) => {
    setNewTask(prev => ({
      ...prev,
      taskTitle: suggestion.title,
      taskCategory: suggestion.category
    }));
  };

  // Open File Quick Inspect
  const handleInspectFile = (fileNum?: string) => {
    if (!fileNum) return;
    const f = files.find(item => item.internalFileNumber === fileNum);
    if (f) {
      setShowFileModal(f);
    } else if (onNavigateToFile) {
      onNavigateToFile(fileNum);
    }
  };

  return (
    <div className="space-[#081729] space-y-6">
      
      {/* HEADER TITLE BAR */}
      <div className="bg-[#081729] p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#C9A227]/20 border border-[#C9A227]/40 text-[#C9A227] rounded-xl font-mono text-xs font-black uppercase flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4" />
              LFR Operations Task Hub
            </span>
            <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded border border-slate-700">
              Role: <strong className="text-amber-300">{currentRole}</strong>
            </span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-white mt-1">
            Task Management & Accountability Engine
          </h1>
          <p className="text-slate-400 text-xs">
            Assign, track, verify, and monitor litigation, registry, court, client, and insurance tasks across firm staff.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isCaseChaser && (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-[#C9A227] hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Assign New Task
            </button>
          )}

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-[#081729] text-[#C9A227] border border-[#C9A227]/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-[#081729] text-[#C9A227] border border-[#C9A227]/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table
            </button>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS & ALERT BANNERS */}
      {notifications.length > 0 && (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
            <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Active Action Alerts & Task Notifications</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {notifications.map(n => (
              <div 
                key={n.id}
                className={`p-2.5 rounded-lg text-xs font-mono border flex items-center justify-between gap-2 ${
                  n.type === 'urgent'
                    ? 'bg-red-950/60 border-red-800 text-red-200'
                    : n.type === 'warning'
                    ? 'bg-amber-950/60 border-amber-800 text-amber-200'
                    : 'bg-blue-950/60 border-blue-800 text-blue-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{n.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MY TASKS DASHBOARD METRICS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => { setStatusFilter('All'); setQuickDateFilter('all'); }}
          className="bg-[#081729] p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition cursor-pointer space-y-1"
        >
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Total Tasks</span>
            <FileText className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">{metrics.total}</div>
          <div className="text-[10px] text-slate-500">Across firm operations</div>
        </div>

        <div 
          onClick={() => { setStatusFilter('Pending'); setQuickDateFilter('all'); }}
          className="bg-[#081729] p-3.5 rounded-xl border border-amber-500/30 hover:border-amber-500/60 transition cursor-pointer space-y-1"
        >
          <div className="text-[10px] uppercase font-mono font-bold text-amber-300 flex items-center justify-between">
            <span>Pending Tasks</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-300 font-mono">{metrics.pending}</div>
          <div className="text-[10px] text-slate-400">Awaiting execution</div>
        </div>

        <div 
          onClick={() => { setStatusFilter('Overdue'); setQuickDateFilter('overdue'); }}
          className="bg-[#081729] p-3.5 rounded-xl border border-red-500/40 hover:border-red-500/80 transition cursor-pointer space-y-1"
        >
          <div className="text-[10px] uppercase font-mono font-bold text-red-400 flex items-center justify-between">
            <span>Overdue Tasks</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-xl font-black text-red-400 font-mono">{metrics.overdue}</div>
          <div className="text-[10px] text-slate-400">Past due date</div>
        </div>

        <div 
          onClick={() => setQuickDateFilter('today')}
          className="bg-[#081729] p-3.5 rounded-xl border border-blue-500/30 hover:border-blue-500/60 transition cursor-pointer space-y-1"
        >
          <div className="text-[10px] uppercase font-mono font-bold text-blue-300 flex items-center justify-between">
            <span>Due Today</span>
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-300 font-mono">{metrics.dueToday}</div>
          <div className="text-[10px] text-slate-400">Requires action today</div>
        </div>

        <div 
          onClick={() => { setStatusFilter('Awaiting Verification'); setQuickDateFilter('all'); }}
          className="bg-[#081729] p-3.5 rounded-xl border border-purple-500/40 hover:border-purple-500/80 transition cursor-pointer space-y-1"
        >
          <div className="text-[10px] uppercase font-mono font-bold text-purple-300 flex items-center justify-between">
            <span>Awaiting Verify</span>
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-300 font-mono">{metrics.awaitingVerification}</div>
          <div className="text-[10px] text-slate-400">Needs assigner approval</div>
        </div>

        <div 
          onClick={() => { setStatusFilter('Completed'); setQuickDateFilter('all'); }}
          className="bg-[#081729] p-3.5 rounded-xl border border-emerald-500/30 hover:border-emerald-500/60 transition cursor-pointer space-y-1"
        >
          <div className="text-[10px] uppercase font-mono font-bold text-emerald-300 flex items-center justify-between">
            <span>Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-300 font-mono">{metrics.completed}</div>
          <div className="text-[10px] text-slate-400">{metrics.completionRate}% completion rate</div>
        </div>
      </div>

      {/* PROPRIETOR STAFF PERFORMANCE & OVERDUE ANALYTICS WIDGET */}
      {isProprietor && (
        <div className="bg-[#081729] p-4 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-serif font-bold text-sm text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#C9A227]" />
              Proprietor Staff Task Performance & Department Distribution
            </h3>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Super Admin Oversight</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {Object.entries(userTaskBreakdown).map(([uname, stat]: [string, { total: number; completed: number; pending: number; overdue: number }]) => (
              <div key={uname} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono truncate">{uname}</span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded">
                    {stat.total} Tasks
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Progress</span>
                    <span>{stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full" 
                      style={{ width: `${stat.total > 0 ? (stat.completed / stat.total) * 100 : 0}%` }} 
                    />
                    <div 
                      className="bg-red-500 h-full" 
                      style={{ width: `${stat.total > 0 ? (stat.overdue / stat.total) * 100 : 0}%` }} 
                    />
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-900">
                  <span className="text-emerald-400">✓ {stat.completed} Done</span>
                  <span className="text-amber-400">⌛ {stat.pending} Pending</span>
                  <span className="text-red-400">⚠ {stat.overdue} Overdue</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEARCH AND FILTER CONTROL PANEL */}
      <div className="bg-[#081729] p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'all', label: 'All Tasks' },
              { id: 'my_tasks', label: 'assigned To Me' },
              { id: 'today', label: 'Due Today' },
              { id: 'week', label: 'Due This Week' },
              { id: 'overdue', label: 'Overdue' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setQuickDateFilter(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  quickDateFilter === tab.id
                    ? 'bg-[#C9A227] text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, file number, description, staff..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-950 text-slate-100 text-xs border border-slate-800 rounded-xl focus:border-[#C9A227] focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-slate-800/80">
          <div>
            <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-1.5 focus:border-[#C9A227] focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">🟡 Pending</option>
              <option value="In Progress">🔵 In Progress</option>
              <option value="Awaiting Verification">🟣 Awaiting Verification</option>
              <option value="Completed">🟢 Completed</option>
              <option value="Overdue">🔴 Overdue</option>
              <option value="Cancelled">⚪ Cancelled</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Task Category</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-1.5 focus:border-[#C9A227] focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Court">Court</option>
              <option value="Registry">Registry</option>
              <option value="Client">Client</option>
              <option value="Insurance">Insurance</option>
              <option value="Financial">Financial</option>
              <option value="Administrative">Administrative</option>
              <option value="Follow-Up">Follow-Up</option>
              <option value="Legal">Legal</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Priority Level</label>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-1.5 focus:border-[#C9A227] focus:outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Assigned Staff</label>
            <select
              value={assigneeFilter}
              onChange={e => setAssigneeFilter(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-1.5 focus:border-[#C9A227] focus:outline-none"
            >
              <option value="All">All Staff Members</option>
              {users.map(u => (
                <option key={u.id} value={u.fullName}>{u.fullName} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {[
            { id: 'Pending', label: 'Pending', color: 'amber', icon: Clock },
            { id: 'In Progress', label: 'In Progress', color: 'blue', icon: Repeat },
            { id: 'Awaiting Verification', label: 'Awaiting Verify', color: 'purple', icon: ShieldCheck },
            { id: 'Completed', label: 'Completed', color: 'emerald', icon: CheckCircle2 },
            { id: 'Overdue', label: 'Overdue / Cancelled', color: 'red', icon: AlertTriangle }
          ].map(col => {
            const colTasks = filteredTasks.filter(t => {
              if (col.id === 'Overdue') {
                return t.status === 'Overdue' || t.status === 'Cancelled';
              }
              return t.status === col.id;
            });

            return (
              <div key={col.id} className="bg-[#081729] rounded-2xl border border-slate-800 p-3 flex flex-col min-w-[260px]">
                
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <col.icon className={`w-4 h-4 ${
                      col.color === 'amber' ? 'text-amber-400' :
                      col.color === 'blue' ? 'text-blue-400' :
                      col.color === 'purple' ? 'text-purple-400' :
                      col.color === 'emerald' ? 'text-emerald-400' : 'text-red-400'
                    }`} />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 font-mono">
                      {col.label}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
                  {colTasks.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-500 border border-dashed border-slate-800/80 rounded-xl">
                      No tasks in this stage
                    </div>
                  ) : (
                    colTasks.map(t => (
                      <div
                        key={t.id}
                        className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-[#C9A227]/50 transition shadow-md space-y-2.5 group relative"
                      >
                        {/* Top Badge Row */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-amber-300">
                            {t.taskCategory}
                          </span>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            t.priority === 'Urgent' ? 'bg-red-950 border-red-700 text-red-300 animate-pulse' :
                            t.priority === 'High' ? 'bg-orange-950 border-orange-700 text-orange-300' :
                            t.priority === 'Medium' ? 'bg-amber-950 border-amber-700 text-amber-300' :
                            'bg-slate-900 border-slate-700 text-slate-400'
                          }`}>
                            {t.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <div className="font-bold text-white text-xs line-clamp-2 leading-snug">
                          {t.taskTitle}
                        </div>

                        {/* File Link */}
                        {t.fileNumber && (
                          <button
                            onClick={() => handleInspectFile(t.fileNumber)}
                            className="text-[11px] font-mono font-bold text-[#C9A227] hover:underline flex items-center gap-1 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-800/40 w-fit cursor-pointer"
                          >
                            <FolderArchive className="w-3 h-3" />
                            {t.fileNumber}
                          </button>
                        )}

                        {/* Description Preview */}
                        {t.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                            "{t.description}"
                          </p>
                        )}

                        {/* Users & Due Date Footer */}
                        <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <div className="flex items-center gap-1 truncate max-w-[140px]">
                            <UserIcon className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate text-slate-300 font-semibold">{t.assignedTo}</span>
                          </div>
                          <div className={`flex items-center gap-1 font-bold ${
                            t.status === 'Overdue' ? 'text-red-400' : 'text-slate-300'
                          }`}>
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{t.dueDate}</span>
                          </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="pt-2 border-t border-slate-900/80 flex items-center justify-between gap-1">
                          <button
                            onClick={() => setSelectedTaskDetails(t)}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] rounded border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-[#C9A227]" />
                            Details
                          </button>

                          {/* Transition Actions */}
                          {t.status === 'Pending' && (
                            <button
                              onClick={() => handleStatusChange(t, 'In Progress')}
                              className="px-2 py-1 bg-blue-950 hover:bg-blue-900 text-blue-300 text-[10px] font-bold rounded border border-blue-700 transition flex items-center gap-1 cursor-pointer"
                            >
                              Start Task →
                            </button>
                          )}

                          {(t.status === 'In Progress' || t.status === 'Overdue') && (
                            <button
                              onClick={() => handleStatusChange(t, 'Completed')}
                              className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[10px] font-bold rounded border border-emerald-700 transition flex items-center gap-1 cursor-pointer"
                            >
                              Mark Complete ✓
                            </button>
                          )}

                          {t.status === 'Awaiting Verification' && (
                            <button
                              onClick={() => setSelectedTaskDetails(t)}
                              className="px-2 py-1 bg-purple-950 hover:bg-purple-900 text-purple-300 text-[10px] font-bold rounded border border-purple-700 transition flex items-center gap-1 cursor-pointer"
                            >
                              Verify Task 🛡️
                            </button>
                          )}
                        </div>

                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: LIST / TABLE VIEW */}
      {viewMode === 'list' && (
        <div className="bg-[#081729] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <th className="p-3">Task ID & Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Related File</th>
                  <th className="p-3">Assigned To & Role</th>
                  <th className="p-3">Assigned By</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                      No tasks found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(t => (
                    <tr key={t.id} className="hover:bg-slate-900/60 transition">
                      <td className="p-3 max-w-xs">
                        <div className="font-mono text-[10px] text-[#C9A227] font-bold">{t.id}</div>
                        <div className="font-bold text-white text-xs">{t.taskTitle}</div>
                        {t.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 italic">{t.description}</div>
                        )}
                      </td>

                      <td className="p-3 font-mono">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-amber-300 font-bold">
                          {t.taskCategory}
                        </span>
                      </td>

                      <td className="p-3 font-mono">
                        {t.fileNumber ? (
                          <button
                            onClick={() => handleInspectFile(t.fileNumber)}
                            className="text-[#C9A227] hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <FolderArchive className="w-3 h-3" />
                            {t.fileNumber}
                          </button>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-200">{t.assignedTo}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{t.assignedToRole}</div>
                      </td>

                      <td className="p-3">
                        <div className="text-slate-300">{t.assignedBy}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{t.assignedByRole}</div>
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          t.priority === 'Urgent' ? 'bg-red-950 border-red-700 text-red-300' :
                          t.priority === 'High' ? 'bg-orange-950 border-orange-700 text-orange-300' :
                          t.priority === 'Medium' ? 'bg-amber-950 border-amber-700 text-amber-300' :
                          'bg-slate-900 border-slate-700 text-slate-400'
                        }`}>
                          {t.priority}
                        </span>
                      </td>

                      <td className="p-3 font-mono">
                        <div className={`font-bold ${t.status === 'Overdue' ? 'text-red-400' : 'text-slate-300'}`}>
                          {t.dueDate}
                        </div>
                        {t.dueTime && <div className="text-[10px] text-slate-500">{t.dueTime}</div>}
                      </td>

                      <td className="p-3">
                        {t.status === 'Pending' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700">
                            🟡 Pending
                          </span>
                        )}
                        {t.status === 'In Progress' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-700">
                            🔵 In Progress
                          </span>
                        )}
                        {t.status === 'Awaiting Verification' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-700">
                            🟣 Awaiting Verify
                          </span>
                        )}
                        {t.status === 'Completed' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                            🟢 Completed
                          </span>
                        )}
                        {t.status === 'Overdue' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-700">
                            🔴 Overdue
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedTaskDetails(t)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700 transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#C9A227]" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE NEW TASK MODAL DIALOG */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A1A2F] border-2 border-[#C9A227] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="px-2.5 py-0.5 bg-[#C9A227]/20 text-[#C9A227] text-[10px] font-mono font-bold rounded border border-[#C9A227]/40 uppercase">
                  Operation Task Assignment
                </span>
                <h3 className="font-serif font-bold text-xl text-white mt-1">
                  Assign New Registry or Litigation Task
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PRESET CHIPS SUGGESTIONS SECTION */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[10px] font-mono uppercase font-bold text-[#C9A227] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Role Preset Suggestions (Click to auto-populate title & category)</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {(PRESET_TASK_SUGGESTIONS[`${currentRole === 'Secretary' ? 'Clerk' : currentRole}_Legal`] || PRESET_TASK_SUGGESTIONS['Proprietor_Legal'] || []).concat(
                  PRESET_TASK_SUGGESTIONS[`${currentRole === 'Secretary' ? 'Clerk' : currentRole}_Clerk`] || PRESET_TASK_SUGGESTIONS['Advocate_Clerk'] || []
                ).map((ps, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPresetSuggestion(ps)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-[#C9A227] hover:text-slate-950 text-slate-300 text-[11px] rounded-lg border border-slate-700 transition cursor-pointer"
                  >
                    + {ps.title} ({ps.category})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Related File Number */}
                <div className="sm:col-span-2 bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                      <FolderArchive className="w-4 h-4 text-[#C9A227]" />
                      <span>Select Active or Closed File (Court Case, Parties & Station Search)</span>
                    </label>
                    <div className="flex gap-1 text-[10px]">
                      {(['All', 'Active', 'Closed'] as const).map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setFileStatusFilterModal(st)}
                          className={`px-2 py-0.5 rounded transition ${
                            fileStatusFilterModal === st 
                              ? 'bg-[#C9A227] text-slate-950 font-bold' 
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search file #, court case #, client, opposing party, court station..."
                      value={fileSearchQuery}
                      onChange={e => setFileSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A227]"
                    />
                  </div>

                  <select
                    value={newTask.fileNumber}
                    onChange={e => {
                      const selNum = e.target.value;
                      const fObj = files.find(f => f.internalFileNumber === selNum);
                      setSelectedFileObj(fObj || null);
                      setNewTask({ ...newTask, fileNumber: selNum });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#C9A227]"
                  >
                    <option value="">No Specific File / General Task</option>
                    {filteredFilesForModal.map(f => (
                      <option key={f.id} value={f.internalFileNumber}>
                        [{f.currentStatus || 'Active'}] {f.internalFileNumber} | {f.courtCaseNumber ? `${f.courtCaseNumber} - ` : ''}{f.clientName} v {f.opposingParty || 'N/A'} ({f.courtStation || 'No Station'})
                      </option>
                    ))}
                  </select>

                  {selectedFileObj && (
                    <div className="bg-slate-900/90 p-2.5 rounded-lg border border-[#C9A227]/30 text-[11px] text-slate-300 space-y-1">
                      <div className="flex justify-between items-center text-[#C9A227] font-bold">
                        <span>{selectedFileObj.internalFileNumber}</span>
                        <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">{selectedFileObj.currentStatus}</span>
                      </div>
                      <div className="text-white font-medium">Court Case: {selectedFileObj.courtCaseNumber || 'N/A'}</div>
                      <div>Parties: <span className="text-white">{selectedFileObj.clientName}</span> vs <span className="text-amber-200">{selectedFileObj.opposingParty || 'N/A'}</span></div>
                      <div className="text-slate-400">Court Station: {selectedFileObj.courtStation || 'N/A'} ({selectedFileObj.courtNumber || 'N/A'})</div>
                    </div>
                  )}
                </div>

                {/* Task Category */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Task Category *</label>
                  <select
                    value={newTask.taskCategory}
                    onChange={e => setNewTask({ ...newTask, taskCategory: e.target.value as TaskCategory })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#C9A227]"
                    required
                  >
                    <option value="Court">Court</option>
                    <option value="Registry">Registry</option>
                    <option value="Client">Client</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Financial">Financial</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Follow-Up">Follow-Up</option>
                    <option value="Legal">Legal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Task Title */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">Task Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Obtain police abstract from Kilimani Police Station"
                    value={newTask.taskTitle}
                    onChange={e => setNewTask({ ...newTask, taskTitle: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#C9A227]"
                    required
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">Detailed Description / Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="Provide specific guidelines, notes or contacts for the assignee..."
                    value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#C9A227]"
                  />
                </div>

                {/* Assign To User */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Assign To Staff Member *</label>
                  <select
                    value={newTask.assignedTo}
                    onChange={e => {
                      const sel = users.find(u => u.fullName === e.target.value);
                      setNewTask({ 
                        ...newTask, 
                        assignedTo: e.target.value,
                        assignedToRole: sel ? sel.role : 'Clerk'
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#C9A227]"
                    required
                  >
                    {assignableUsers.map(u => (
                      <option key={u.id} value={u.fullName}>
                        {u.fullName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Priority Level *</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#C9A227]"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">🔴 Urgent</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={e => {
                      const selected = e.target.value;
                      if (selected && isWeekend(selected)) {
                        const valid = ensureWeekday(selected);
                        setNewTask({ ...newTask, dueDate: valid });
                      } else {
                        setNewTask({ ...newTask, dueDate: selected });
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#C9A227]"
                    required
                  />
                  {newTask.dueDate && isWeekend(newTask.dueDate) && (
                    <span className="text-[10px] text-amber-400 font-semibold block mt-0.5">⚠️ Task due dates cannot fall on weekends. Auto-adjusted to Monday.</span>
                  )}
                </div>

                {/* Due Time */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Due Time (Optional)</label>
                  <input
                    type="time"
                    value={newTask.dueTime}
                    onChange={e => setNewTask({ ...newTask, dueTime: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#C9A227]"
                  />
                </div>

              </div>

              {/* Recurring Option */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-[#C9A227]" />
                  <div>
                    <span className="font-bold text-slate-200">Recurring Task</span>
                    <p className="text-[10px] text-slate-500">Auto-repeat routine checks like upcoming lists or diary checks.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTask.isRecurring}
                    onChange={e => setNewTask({ ...newTask, isRecurring: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 text-[#C9A227] focus:ring-[#C9A227]"
                  />
                  {newTask.isRecurring && (
                    <select
                      value={newTask.recurringInterval}
                      onChange={e => setNewTask({ ...newTask, recurringInterval: e.target.value as any })}
                      className="bg-slate-900 text-slate-200 text-xs p-1.5 rounded-lg border border-slate-700"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Routine">Routine</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C9A227] hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Assign & Save Task
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* INSPECT & UPDATE TASK DETAIL MODAL */}
      {selectedTaskDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A1A2F] border-2 border-[#C9A227] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#C9A227]">{selectedTaskDetails.id}</span>
                  <span className="px-2 py-0.5 bg-slate-900 text-slate-300 text-[10px] font-mono font-bold rounded border border-slate-800">
                    {selectedTaskDetails.taskCategory}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-xl text-white mt-1">
                  {selectedTaskDetails.taskTitle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTaskDetails(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Details Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Assigned To</span>
                  <span className="font-bold text-slate-100">{selectedTaskDetails.assignedTo} ({selectedTaskDetails.assignedToRole})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Assigned By</span>
                  <span className="font-bold text-amber-300">{selectedTaskDetails.assignedBy} ({selectedTaskDetails.assignedByRole})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Due Date</span>
                  <span className={`font-bold font-mono ${selectedTaskDetails.status === 'Overdue' ? 'text-red-400' : 'text-slate-200'}`}>
                    {selectedTaskDetails.dueDate} {selectedTaskDetails.dueTime}
                  </span>
                </div>
              </div>

              {selectedTaskDetails.fileNumber && (
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase block">Linked Registry File</span>
                    <span className="font-bold text-[#C9A227] font-mono">{selectedTaskDetails.fileNumber}</span>
                  </div>
                  <button
                    onClick={() => handleInspectFile(selectedTaskDetails.fileNumber)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-600 transition flex items-center gap-1 cursor-pointer"
                  >
                    <FolderArchive className="w-3.5 h-3.5 text-[#C9A227]" />
                    Inspect File
                  </button>
                </div>
              )}

              {selectedTaskDetails.description && (
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Task Instructions</span>
                  <p className="text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 leading-relaxed italic">
                    "{selectedTaskDetails.description}"
                  </p>
                </div>
              )}

              {selectedTaskDetails.completionNotes && (
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Assignee Completion Notes</span>
                  <p className="text-emerald-300 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/60 leading-relaxed font-mono">
                    ✓ {selectedTaskDetails.completionNotes}
                  </p>
                </div>
              )}

              {selectedTaskDetails.verificationNotes && (
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Verification / Audit Notes</span>
                  <p className="text-purple-300 bg-purple-950/40 p-2.5 rounded-lg border border-purple-800/60 leading-relaxed font-mono">
                    🛡️ {selectedTaskDetails.verificationNotes} ({selectedTaskDetails.verifiedBy} on {selectedTaskDetails.verifiedDate})
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions / Progress Updates Form */}
            <div className="space-y-3 pt-2">
              <label className="block font-bold text-slate-200 text-xs uppercase tracking-wider">
                Update Task Progress & Verification
              </label>

              {/* If Task Awaiting Verification and current user is Assigner or Proprietor */}
              {selectedTaskDetails.status === 'Awaiting Verification' && (isProprietor || currentUser?.fullName === selectedTaskDetails.assignedBy) ? (
                <div className="bg-purple-950/50 p-4 rounded-xl border border-purple-800 space-y-3">
                  <span className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Assigner Task Verification Decision
                  </span>
                  <textarea
                    rows={2}
                    placeholder="Enter verification notes or audit comments..."
                    value={verificationNotesInput}
                    onChange={e => setVerificationNotesInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerifyTask(selectedTaskDetails, 'approve')}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Verify Task
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyTask(selectedTaskDetails, 'reject')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject & Request Revision
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedTaskDetails.status !== 'In Progress' && selectedTaskDetails.status !== 'Completed' && (
                    <button
                      onClick={() => handleStatusChange(selectedTaskDetails, 'In Progress')}
                      className="px-3.5 py-1.5 bg-blue-950 border border-blue-700 hover:bg-blue-900 text-blue-300 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Set to 'In Progress'
                    </button>
                  )}

                  {selectedTaskDetails.status !== 'Completed' && (
                    <button
                      onClick={() => handleStatusChange(selectedTaskDetails, 'Completed')}
                      className="px-3.5 py-1.5 bg-emerald-950 border border-emerald-700 hover:bg-emerald-900 text-emerald-300 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Mark as 'Completed'
                    </button>
                  )}

                  {isProprietor && onDeleteTask && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this task?")) {
                          onDeleteTask(selectedTaskDetails.id);
                          setSelectedTaskDetails(null);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-red-950 border border-red-800 hover:bg-red-900 text-red-300 font-bold text-xs rounded-xl transition cursor-pointer ml-auto"
                    >
                      Delete Task
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedTaskDetails(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* LINKED FILE QUICK INSPECT MODAL */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A1A2F] border-2 border-[#C9A227] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#C9A227] uppercase font-bold">Registry File Quick View</span>
                <h3 className="font-serif font-bold text-lg text-white">{showFileModal.internalFileNumber}</h3>
              </div>
              <button onClick={() => setShowFileModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-500 block text-[10px]">Client Name:</span> <strong className="text-white">{showFileModal.clientName}</strong></div>
                <div><span className="text-slate-500 block text-[10px]">Court Case No:</span> <strong className="text-amber-300 font-mono">{showFileModal.courtCaseNumber || 'Registry'}</strong></div>
                <div><span className="text-slate-500 block text-[10px]">Opposing Party:</span> <span className="text-slate-200">{showFileModal.opposingParty}</span></div>
                <div><span className="text-slate-500 block text-[10px]">Court Station:</span> <span className="text-slate-200">{showFileModal.courtStation}</span></div>
                <div><span className="text-slate-500 block text-[10px]">Assigned Advocate:</span> <span className="text-slate-200">{showFileModal.advocateName}</span></div>
                <div><span className="text-slate-500 block text-[10px]">File Status:</span> <span className="text-emerald-400 font-bold">{showFileModal.currentStatus}</span></div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowFileModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
              >
                Close Quick View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
