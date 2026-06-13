import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function GroupBalances({ groupId, onRecordPayment }) {
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBalances();
  }, [groupId]);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/groups/${groupId}/balances`);
      setBalances(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-4">Loading balances...</div>;
  if (error) return <div className="text-red-500 py-4">{error}</div>;
  if (!balances) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Group Balances</h3>
        <button
          onClick={onRecordPayment}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Record Payment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <h4 className="font-medium text-gray-700 border-b pb-2 mb-4">Who owes whom</h4>
          {balances.pairwiseDebts.length === 0 ? (
            <p className="text-gray-500 text-sm">All settled up!</p>
          ) : (
            <ul className="space-y-3">
              {balances.pairwiseDebts.map((debt, idx) => (
                <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{debt.debtor.fullName}</span> owes{' '}
                    <span className="font-medium text-gray-900">{debt.creditor.fullName}</span>
                  </div>
                  <div className="font-semibold text-green-600">
                    ${debt.amount.toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <h4 className="font-medium text-gray-700 border-b pb-2 mb-4">Member Balances</h4>
          <ul className="space-y-3">
            {balances.memberBalances.map((mb, idx) => (
              <li key={idx} className="flex justify-between items-center p-2">
                <span className="text-sm font-medium">{mb.user.fullName}</span>
                <span className={`font-semibold ${mb.balance > 0 ? 'text-green-600' : mb.balance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {mb.balance > 0 ? '+' : ''}${mb.balance.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
