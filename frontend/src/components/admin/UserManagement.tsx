import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, UserCheck, UserX, Filter, Users } from 'lucide-react';
import LoadingScreen from '../common/LoadingScreen';
import Modal from '../common/Modal';
import UserForm from './UserForm';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import userService from '../../services/userService';
import authService from '../../services/authService';
import { User, CreateUserData, UpdateUserData } from '../../types';


const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getUsers();
      if (response.success && response.data) {
        let usersArray: User[] = [];
        if (Array.isArray(response.data)) {
          usersArray = response.data;
        } else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
          usersArray = (response.data as any).results || [];
        }
        setUsers(usersArray);
      } else {
        setError(response.error || 'Failed to fetch users');
        setUsers([]);
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeComponent = async () => {
      if (!authService.isAuthenticated()) {
        setError('Please log in to access user management');
        setLoading(false);
        return;
      }
      const userRole = authService.getUserRole();
      if (userRole !== 'admin' && userRole !== 'examiner') {
        setError('Access denied. Admin or Examiner privileges required.');
        setLoading(false);
        return;
      }
      await fetchUsers();
    };
    initializeComponent();
  }, []);

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleToggleUserStatus = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Optimistic update
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, is_active: !u.is_active } : u
    ));

    const response = await userService.updateUser(userId, { is_active: !user.is_active });
    if (!response.success) {
      // Revert on failure
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_active: user.is_active } : u
      ));
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = (userId: number) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-4 text-sm font-medium text-slate-800 dark:text-slate-200">Are you sure you want to delete this user?</p>
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              onClick={closeToast}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20 active:scale-95"
              onClick={async () => {
                if (closeToast) closeToast();
                const response = await userService.deleteUser(userId);
                if (response.success) {
                  setUsers(prev => prev.filter(user => user.id !== userId));
                  toast.success('User deleted successfully');
                } else {
                  toast.error('Failed to delete user');
                }
              }}
            >
              Confirm Delete
            </button>
          </div>
        </div>
      ),
      { autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
    );
  };

  const handleAddUser = async (data: CreateUserData) => {
    const response = await userService.createUser(data);
    if (response.success && response.data) {
      setUsers(prev => [response.data!, ...prev]);
      setIsModalOpen(false);
      toast.success('User created successfully');
    } else {
      toast.error('Failed to create user: ' + (response.error || 'Unknown error'));
    }
  };

  const handleEditUser = async (data: UpdateUserData) => {
    if (editingUser) {
      const response = await userService.updateUser(editingUser.id, data);
      if (response.success && response.data) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? response.data! : u));
        setEditingUser(null);
        setIsModalOpen(false);
        toast.success('User updated successfully');
      } else {
        toast.error('Failed to update user: ' + (response.error || 'Unknown error'));
      }
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'examiner': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'student': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  if (loading) {
    return <LoadingScreen fullScreen={false} message="Initializing Portal..." transparent />;
  }

  if (error) {
    const isAuthError = error.includes('log in') || error.includes('Access denied');
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-rose-500 text-center">
          <p className="text-lg font-semibold mb-2">Authentication Required</p>
          <p className="text-sm opacity-75 mb-4">{error}</p>
          <div className="space-x-3">
            {isAuthError && (
              <button
                onClick={() => window.location.href = '/login'}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Go to Login
              </button>
            )}
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-10"
    >
      {/* Header Section - Redesigned */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 border-b border-dark-border-primary pb-12 bg-dark-secondary p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-dark-accent-indigo/5 blur-[120px] pointer-events-none" />
        <div className="space-y-6 relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-dark-accent-indigo">Access Orchestration</p>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">Personnel <span className="text-dark-text-muted italic">Terminal</span></h2>
          <p className="text-dark-text-secondary font-medium text-lg max-w-2xl leading-relaxed">
            Coordinate system access permissions and monitor user role distribution globally.
          </p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="bg-white text-dark-primary px-10 py-5 rounded-2xl flex items-center justify-center gap-4 hover:bg-dark-accent-indigo hover:text-white transition-all shadow-2xl active:scale-95 font-black text-[10px] uppercase tracking-[0.2em] border border-white/10 group relative z-10 w-full xl:w-auto"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>Authorize Member</span>
        </button>
      </div>

      {/* Modern Stats Overview - Redesigned */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Network Entities', value: users.length, icon: Users, color: 'text-dark-accent-indigo' },
          { label: 'Verified Online', value: users.filter(u => u.is_active).length, icon: UserCheck, color: 'text-dark-accent-emerald' },
          { label: 'Access Revoked', value: users.filter(u => !u.is_active).length, icon: UserX, color: 'text-dark-accent-rose' },
          { label: 'Faculty Nodes', value: users.filter(u => u.role === 'examiner').length, icon: Edit2, color: 'text-dark-accent-cyan' },
        ].map((stat, i) => (
          <div key={i} className="bg-dark-secondary p-8 rounded-3xl border border-dark-border-primary hover:border-dark-text-muted transition-all duration-300 group shadow-lg">
            <div className="flex items-start justify-between mb-6">
              <div className={`p-2.5 rounded-xl bg-dark-tertiary ${stat.color} border border-dark-border-primary shadow-inner group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-dark-tertiary animate-pulse" />
            </div>
            <p className="text-4xl font-black text-white mb-2 tracking-tight tabular-nums leading-none">{stat.value}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dark-text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Advanced Filters - Redesigned */}
      <div className="flex flex-col lg:flex-row items-center gap-6 bg-dark-secondary/50 p-3 rounded-3xl border border-dark-border-primary ring-1 ring-white/5">
        <div className="flex-1 relative group w-full">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-dark-text-muted group-focus-within:text-dark-accent-indigo transition-colors" />
          <input
            type="text"
            placeholder="Query by identifier, email, or credentials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-dark-tertiary/30 border border-dark-border-primary rounded-2xl focus:ring-1 focus:ring-dark-accent-indigo focus:border-dark-accent-indigo outline-none transition-all placeholder:text-dark-text-muted font-black text-[10px] uppercase tracking-[0.2em] text-white"
          />
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto p-2 bg-dark-tertiary/20 rounded-2xl border border-dark-border-primary">
          <div className="relative flex-1 lg:flex-none">
            <Filter size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-dark-accent-indigo pointer-events-none" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full lg:w-72 pl-16 pr-12 py-5 bg-dark-secondary border border-dark-border-primary rounded-xl focus:ring-1 focus:ring-dark-accent-indigo outline-none font-black text-[10px] uppercase tracking-[0.2em] text-white appearance-none cursor-pointer shadow-xl"
            >
              <option value="all">Permission: All Channels</option>
              <option value="admin">Admin Protocol</option>
              <option value="examiner">Faculty Node</option>
              <option value="student">Student Link</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Member Table - Redesigned */}
      <div className="border border-dark-border-primary rounded-3xl overflow-hidden bg-dark-secondary/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-dark-tertiary/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-dark-text-muted">Entity / Identifier</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-dark-text-muted">Clearance Level</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-dark-text-muted">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-dark-text-muted">Activity Matrix</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-dark-text-muted">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border-primary/30">
              <AnimatePresence>
                {filteredUsers.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-dark-accent-indigo/[0.02] transition-colors group"
                  >
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <div className="w-12 h-12 bg-dark-tertiary rounded-xl flex items-center justify-center border border-dark-border-primary group-hover:bg-dark-accent-indigo group-hover:text-white transition-all shadow-inner">
                            <span className="text-sm font-black text-white italic">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-dark-secondary ${user.is_active ? 'bg-dark-accent-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-dark-accent-rose'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white group-hover:text-dark-accent-indigo transition-colors tracking-tight">{user.username}</p>
                          <p className="text-[10px] text-dark-text-muted font-medium mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter rounded border ${user.role === 'admin' ? 'bg-dark-accent-indigo/10 text-dark-accent-indigo border-dark-accent-indigo/20' :
                        user.role === 'examiner' ? 'bg-dark-accent-cyan/10 text-dark-accent-cyan border-dark-accent-cyan/20' :
                          'bg-dark-accent-emerald/10 text-dark-accent-emerald border-dark-accent-emerald/20'
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${user.is_active ? 'text-dark-accent-emerald' : 'text-dark-accent-rose opacity-50'}`}>
                        {user.is_active ? 'Nominal' : 'Access Restricted'}
                      </p>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                       <p className="text-[10px] font-black text-white uppercase tracking-widest italic leading-none">
                         {user.last_login ? `Active ${new Date(user.last_login).toLocaleDateString()}` : 'No Audit Recorded'}
                       </p>
                       <p className="text-[9px] text-dark-text-muted font-black uppercase tracking-[0.2em] mt-2 opacity-50">Member Since {user.created_at ? new Date(user.created_at).getFullYear() : '2024'}</p>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                          className="p-2.5 bg-dark-tertiary text-dark-text-muted hover:text-white hover:bg-dark-accent-indigo rounded-xl transition-all border border-dark-border-primary"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user.id)}
                          className={`p-2.5 bg-dark-tertiary ${user.is_active ? 'text-dark-accent-amber hover:text-white hover:bg-dark-accent-amber' : 'text-dark-accent-emerald hover:text-white hover:bg-dark-accent-emerald'} rounded-xl transition-all border border-dark-border-primary`}
                        >
                          {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2.5 bg-dark-accent-rose/5 text-dark-text-muted hover:text-white hover:bg-dark-accent-rose rounded-xl transition-all border border-dark-border-primary"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingUser(null); }}
        title={editingUser ? 'Update Profile' : 'Register Member'}
      >
        <UserForm
          onSubmit={editingUser ? handleEditUser : handleAddUser}
          initialData={editingUser || undefined}
        />
      </Modal>
    </motion.div >
  );
};

export default UserManagement;
