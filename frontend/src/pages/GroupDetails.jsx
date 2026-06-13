import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import ExpenseList from '../components/expenses/ExpenseList';
import ExpenseForm from '../components/expenses/ExpenseForm';
import GroupBalances from '../components/balances/GroupBalances';
import SettlementList from '../components/settlements/SettlementList';
import RecordSettlementModal from '../components/settlements/RecordSettlementModal';

export default function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [balancesKey, setBalancesKey] = useState(0);

  const [activeTab, setActiveTab] = useState('expenses'); // expenses, balances, settlements

  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  const fetchGroup = async () => {
    try {
      const res = await api.get(`/api/v1/groups/${groupId}`);
      setGroup(res.data.group);
      setMembers(res.data.members);
    } catch (err) {
      console.error(err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchGroup();
  }, [groupId]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchResult(null);
    try {
      const res = await api.get(`/api/v1/users/search?email=${searchEmail}`);
      setSearchResult(res.data.user);
    } catch {
      alert('User not found');
    }
  };

  const handleAddMember = async () => {
    if (!searchResult) return;
    try {
      await api.post(`/api/v1/groups/${groupId}/members`, { userId: searchResult.id });
      setSearchEmail('');
      setSearchResult(null);
      fetchGroup();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/api/v1/groups/${groupId}/members/${userId}`);
      fetchGroup();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleTransferAdmin = async (userId) => {
    if (!window.confirm('Make this user an admin?')) return;
    try {
      await api.patch(`/api/v1/groups/${groupId}/admin`, { userId });
      fetchGroup();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to transfer admin');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.post(`/api/v1/groups/${groupId}/leave`);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to leave group');
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this group?')) return;
    try {
      await api.delete(`/api/v1/groups/${groupId}`);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to archive group');
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  if (!group) return null;

  const currentMember = members.find(m => m.userId === user?.id);
  const isAdmin = currentMember?.role === 'ADMIN';
  const memberCount = members.length;

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto w-full max-w-4xl">
        <button onClick={() => navigate('/dashboard')} className="mb-4 text-sm font-medium text-emerald-600 hover:underline">
          &larr; Back to Dashboard
        </button>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-t-lg bg-white p-6 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            {group.description && <p className="mt-1 text-zinc-500">{group.description}</p>}
            <p className="mt-2 text-sm font-medium text-zinc-400">{memberCount} Members {isAdmin && '· Admin'}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleLeave} className="rounded border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">
              Leave Group
            </button>
            {isAdmin && (
              <button onClick={handleArchive} className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Archive Group
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border-x border-b border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 rounded-b-lg mb-8">
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'expenses' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('balances')}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'balances' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              Balances
            </button>
            <button
              onClick={() => setActiveTab('settlements')}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'settlements' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              Settlements
            </button>
          </div>
          
          <div className="p-6">
            {activeTab === 'expenses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Expenses</h3>
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition shadow-sm"
                  >
                    Add Expense
                  </button>
                </div>
                <ExpenseList groupId={groupId} />
              </div>
            )}

            {activeTab === 'balances' && (
              <GroupBalances 
                groupId={groupId} 
                key={balancesKey} 
                onRecordPayment={() => setShowSettlementModal(true)} 
              />
            )}

            {activeTab === 'settlements' && (
              <SettlementList groupId={groupId} keyProp={balancesKey} />
            )}
          </div>
        </div>

        {/* Members Section */}
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm mb-8">
          <h2 className="text-xl font-bold mb-4">Members</h2>
          
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 mb-6">
            {members.map(m => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{m.user.fullName} {m.userId === user.id && '(You)'}</p>
                  <p className="text-sm text-zinc-500">{m.user.email} · {m.role}</p>
                </div>
                {isAdmin && m.userId !== user.id && (
                  <div className="flex gap-2">
                    {m.role !== 'ADMIN' && (
                      <button onClick={() => handleTransferAdmin(m.userId)} className="text-sm font-medium text-blue-600 hover:underline">Make Admin</button>
                    )}
                    <button onClick={() => handleRemoveMember(m.userId)} className="text-sm font-medium text-red-600 hover:underline">Remove</button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {isAdmin && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
              <h3 className="mb-2 font-medium">Add Member</h3>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                  required
                />
                <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                  Search
                </button>
              </form>

              {searchResult && (
                <div className="mt-4 flex items-center justify-between rounded border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-900/20">
                  <div>
                    <p className="font-medium">{searchResult.fullName}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{searchResult.email}</p>
                  </div>
                  <button onClick={handleAddMember} className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
                    Add to Group
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showExpenseModal && (
        <ExpenseForm 
          groupId={groupId} 
          members={members}
          onClose={() => setShowExpenseModal(false)}
          onSuccess={() => {
            setShowExpenseModal(false);
            setBalancesKey(prev => prev + 1); // refresh expenses & balances
          }}
        />
      )}

      {showSettlementModal && (
        <RecordSettlementModal
          groupId={groupId}
          onClose={() => setShowSettlementModal(false)}
          onSettlementCreated={() => setBalancesKey(prev => prev + 1)}
          // Pass pairwise debts down from GroupBalances but wait... we didn't pass it!
          // Actually, we can fetch debts directly in RecordSettlementModal, let me fix it in RecordSettlementModal to fetch debts!
        />
      )}
    </div>
  );
}
