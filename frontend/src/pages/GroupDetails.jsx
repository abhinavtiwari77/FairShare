import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import ExpenseList from '../components/expenses/ExpenseList';
import ExpenseForm from '../components/expenses/ExpenseForm';

export default function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [data, setData] = useState(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  const fetchGroup = async () => {
    try {
      const res = await api.get(`/api/v1/groups/${id}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    (async () => {
      await fetchGroup();
    })();
  }, [id]);

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
      await api.post(`/api/v1/groups/${id}/members`, { userId: searchResult.id });
      setSearchEmail('');
      setSearchResult(null);
      fetchGroup();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/api/v1/groups/${id}/members/${userId}`);
      fetchGroup();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleTransferAdmin = async (userId) => {
    if (!confirm('Make this user an admin?')) return;
    try {
      await api.patch(`/api/v1/groups/${id}/admin`, { userId });
      fetchGroup();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to transfer admin');
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.post(`/api/v1/groups/${id}/leave`);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to leave group');
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this group?')) return;
    try {
      await api.delete(`/api/v1/groups/${id}`);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to archive group');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!data) return <div className="p-8">Group not found</div>;

  const { group, members, memberCount, isAdmin } = data;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 p-8 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto w-full max-w-4xl">
        <button onClick={() => navigate('/dashboard')} className="mb-4 text-sm font-medium text-emerald-600 hover:underline">
          &larr; Back to Dashboard
        </button>

        <div className="flex items-center justify-between rounded-t-lg bg-white p-6 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            {group.description && <p className="mt-1 text-zinc-500">{group.description}</p>}
            <p className="mt-2 text-sm font-medium text-zinc-400">{memberCount} Members {isAdmin && '· Admin'}</p>
          </div>
          <div className="flex flex-col gap-2">
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

        {/* Expenses Section */}
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Expenses</h2>
            <button 
              onClick={() => setShowAddExpense(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Add Expense
            </button>
          </div>
          
          {showAddExpense ? (
            <div className="bg-zinc-50 p-6 rounded-lg border border-zinc-200 mb-6 dark:bg-zinc-800 dark:border-zinc-700">
              <h3 className="text-lg font-bold mb-4">Add New Expense</h3>
              <ExpenseForm 
                groupId={id}
                members={members}
                onSuccess={() => {
                  setShowAddExpense(false);
                  window.location.reload(); 
                }}
                onCancel={() => setShowAddExpense(false)}
              />
            </div>
          ) : (
            <ExpenseList groupId={id} />
          )}
        </div>

        {/* Members Section */}
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-bold mb-4">Members</h2>
          
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {members.map(m => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{m.user.fullName} {m.userId === user.id && '(You)'}</p>
                  <p className="text-sm text-zinc-500">{m.user.email} · {m.role}</p>
                </div>
                {isAdmin && m.userId !== user.id && (
                  <div className="flex gap-2">
                    {m.role !== 'ADMIN' && (
                      <button onClick={() => handleTransferAdmin(m.userId)} className="text-sm font-medium text-blue-600 hover:underline">
                        Make Admin
                      </button>
                    )}
                    <button onClick={() => handleRemoveMember(m.userId)} className="text-sm font-medium text-red-600 hover:underline">
                      Remove
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {isAdmin && (
            <div className="mt-8 rounded bg-zinc-50 p-4 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800">
              <h3 className="text-lg font-semibold mb-2">Add Member</h3>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="User's email"
                  value={searchEmail}
                  onChange={e => setSearchEmail(e.target.value)}
                  className="flex-1 rounded border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-900"
                />
                <button type="submit" className="rounded bg-zinc-800 px-4 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-600 dark:hover:bg-zinc-500">
                  Search
                </button>
              </form>
              
              {searchResult && (
                <div className="mt-4 flex items-center justify-between rounded border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950">
                  <div>
                    <p className="font-medium text-emerald-800 dark:text-emerald-200">{searchResult.fullName}</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">{searchResult.email}</p>
                  </div>
                  <button onClick={handleAddMember} className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                    Add to Group
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
