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
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div className="space-y-2">
          <h2 className="text-5xl font-display font-black text-slate-900 dark:text-white tracking-tight">User Management</h2>
          <p className="text-lg text-slate-500 font-medium">Coordinate system access and monitor user roles globally.</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="w-full sm:w-auto bg-blue-600 text-white px-10 py-5 rounded-[1.5rem] flex items-center justify-center space-x-3 hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/40 hover:scale-105 active:scale-95 font-black uppercase text-sm tracking-widest"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Modern Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Members', value: users.length, icon: Users, color: 'blue', trend: '+12%' },
          { label: 'Verified Active', value: users.filter(u => u.is_active).length, icon: UserCheck, color: 'emerald', trend: 'Healthy' },
          { label: 'Paused Access', value: users.filter(u => !u.is_active).length, icon: UserX, color: 'rose', trend: 'Attention' },
          { label: 'Faculty Staff', value: users.filter(u => u.role === 'examiner').length, icon: Edit2, color: 'purple', trend: 'Stable' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * i }}
            className="glass p-8 rounded-[2.5rem] shadow-lg hover:shadow-2xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <stat.icon size={120} />
            </div>
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-8">
                <div className={`w-14 h-14 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <stat.icon size={28} className={`text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-full bg-${stat.color}-500/10 text-${stat.color}-600`}>{stat.trend}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] font-display">{stat.label}</p>
                <p className="text-4xl font-black font-display text-slate-900 dark:text-white tracking-tighter">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Advanced Filters */}
      <div className="glass p-6 rounded-[2.5rem] shadow-xl">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative group">
            <Search size={22} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Query by name, email, or credentials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-8 py-5 bg-slate-100/50 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-700/30 rounded-[1.5rem] focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            <div className="relative">
              <Filter size={20} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-14 py-5 bg-slate-100/50 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-700/30 rounded-[1.5rem] focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none text-xs font-black uppercase tracking-[0.1em] text-slate-600 dark:text-slate-300 cursor-pointer appearance-none min-w-[200px]"
              >
                <option value="all">Global Access</option>
                <option value="admin">Administrators</option>
                <option value="examiner">Faculty Staff</option>
                <option value="student">Student Body</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Member Table */}
      <div className="glass rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 relative">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md">
              <tr>
                <th className="px-10 py-8 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] font-display">Identity</th>
                <th className="px-10 py-8 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] font-display">Level</th>
                <th className="px-10 py-8 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] font-display">Status</th>
                <th className="px-10 py-8 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] font-display">Activity</th>
                <th className="px-10 py-8 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] font-display">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
              <AnimatePresence>
                {filteredUsers.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-blue-600/5 transition-colors duration-300"
                  >
                    <td className="px-10 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative">
                          <div className={`w-14 h-14 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                            <span className="text-lg font-black text-slate-600 dark:text-slate-300 font-display">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                          </div>
                          {user.is_active && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900" />
                          )}
                        </div>
                        <div className="ml-6">
                          <div className="text-base font-black text-slate-900 dark:text-white font-display uppercase tracking-tight">{user.username}</div>
                          <div className="text-xs text-slate-500 font-medium tracking-wide">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 whitespace-nowrap">
                      <span className={`px-4 py-1.5 text-[10px] font-black rounded-xl border uppercase tracking-widest ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-10 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${user.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {user.is_active ? 'Online' : 'Restricted'}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {/* Note: last_login might be null if never logged in */}
                        {user.last_login ? `Last seen ${new Date(user.last_login).toLocaleDateString()}` : 'No activity logged'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">Member since {user.created_at ? new Date(user.created_at).getFullYear() : 'Unknown'}</div>
                    </td>
                    <td className="px-10 py-6 whitespace-nowrap text-right h-full">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                          className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:scale-110"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user.id)}
                          className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-800 ${user.is_active ? 'text-amber-600 hover:bg-amber-600' : 'text-emerald-600 hover:bg-emerald-600'} hover:text-white transition-all shadow-sm hover:scale-110`}
                        >
                          {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm hover:scale-110"
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
