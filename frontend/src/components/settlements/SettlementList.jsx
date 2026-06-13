import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function SettlementList({ groupId, keyProp }) {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    fetchSettlements();
  }, [groupId, keyProp]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/groups/${groupId}/settlements`);
      setSettlements(data.settlements);
    } catch (error) {
      console.error('Failed to load settlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;
    try {
      await api.delete(`/groups/${groupId}/settlements/${id}`);
      fetchSettlements();
      // Wait, deleting a settlement affects balances! 
      // The parent component should be notified to refresh balances.
      // But for simplicity, we can just reload the window or emit an event.
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete payment');
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading history...</div>;
  if (settlements.length === 0) return <div className="text-sm text-gray-500">No payment history.</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment History</h3>
      <ul className="space-y-3">
        {settlements.map(s => {
          const isCreator = s.createdBy.id === user.id;
          const isPayer = s.payer.id === user.id;
          const isReceiver = s.receiver.id === user.id;
          const canDelete = isCreator || isPayer || isReceiver;

          return (
            <li key={s.id} className="p-3 bg-white border border-gray-100 rounded shadow-sm flex justify-between items-center">
              <div>
                <p className="text-sm">
                  <span className="font-medium text-gray-900">{s.payer.fullName}</span> paid <span className="font-medium text-gray-900">{s.receiver.fullName}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(s.createdAt).toLocaleDateString()} {s.note && `- ${s.note}`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-green-600">${Number(s.amount).toFixed(2)}</span>
                {canDelete && (
                  <button onClick={() => handleDelete(s.id)} className="text-red-500 text-xs hover:underline">
                    Delete
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
