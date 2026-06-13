import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import CreateGroupModal from '../components/CreateGroupModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [balances, setBalances] = useState({ totalOwe: 0, totalOwed: 0, netBalance: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [groupsRes, balancesRes] = await Promise.all([
        api.get('/api/v1/groups'),
        api.get('/api/v1/users/me/balances')
      ]);
      setGroups(groupsRes.data.groups);
      setBalances(balancesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 p-8 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Create Group
            </button>
            <button
              onClick={logout}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center items-center">
            <p className="text-sm font-medium text-gray-500 uppercase">You Owe</p>
            <p className="text-2xl font-bold text-red-600">${balances.totalOwe.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center items-center">
            <p className="text-sm font-medium text-gray-500 uppercase">You are Owed</p>
            <p className="text-2xl font-bold text-green-600">${balances.totalOwed.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center items-center">
            <p className="text-sm font-medium text-gray-500 uppercase">Net Balance</p>
            <p className={`text-2xl font-bold ${balances.netBalance > 0 ? 'text-green-600' : balances.netBalance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {balances.netBalance > 0 ? '+' : ''}${balances.netBalance.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Groups</h2>
          </div>
          
          {loading ? (
            <div className="py-8 text-center text-zinc-500">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">
              You are not in any groups yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {groups.map(group => (
                <Link key={group.id} to={`/groups/${group.id}`} className="block rounded-lg border border-zinc-200 p-4 hover:border-emerald-500 hover:shadow-md transition-all dark:border-zinc-700 dark:hover:border-emerald-500">
                  <h3 className="text-lg font-bold">{group.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">{group.description}</p>
                  <p className="mt-2 text-xs font-medium text-emerald-600">{group._count?.members} Members</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      {isModalOpen && (
        <CreateGroupModal 
          onClose={() => setIsModalOpen(false)} 
          onCreated={(newGroup) => {
            setGroups([newGroup, ...groups]);
            fetchDashboardData(); 
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
