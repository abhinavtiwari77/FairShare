import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import CreateGroupModal from '../components/CreateGroupModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/api/v1/groups');
      setGroups(res.data.groups);
    } catch (err) {
      console.error(err);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 p-8 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={logout}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Logout
          </button>
        </div>
        
        <div className="mt-8 mb-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold">Welcome, {user?.fullName}!</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Your email is {user?.email}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Groups</h2>
            <button onClick={() => setIsModalOpen(true)} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              + New Group
            </button>
          </div>
          {groups.length === 0 ? (
            <p className="text-zinc-500">You don't have any groups yet.</p>
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
            fetchGroups(); // refresh to get member counts properly
          }}
        />
      )}
    </div>
  );
}
