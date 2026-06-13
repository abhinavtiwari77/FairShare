import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function RecordSettlementModal({ groupId, onClose, onSettlementCreated }) {
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pairwiseDebts, setPairwiseDebts] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchDebts = async () => {
      try {
        const { data } = await api.get(`/groups/${groupId}/balances`);
        setPairwiseDebts(data.pairwiseDebts);
      } catch (err) {
        setError('Failed to load debts');
      } finally {
        setFetching(false);
      }
    };
    fetchDebts();
  }, [groupId]);

  // Find the selected debt to validate max amount
  const selectedDebt = pairwiseDebts.find(d => d.creditorId === receiverId);
  const maxAmount = selectedDebt ? selectedDebt.amount : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receiverId || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      setError('Amount must be positive');
      return;
    }

    if (numAmount > maxAmount + 0.001) {
      setError(`Cannot settle more than the owed amount ($${maxAmount.toFixed(2)})`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.post(`/groups/${groupId}/settlements`, {
        receiverId,
        amount: numAmount,
        note
      });
      onSettlementCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record settlement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">Record a Payment</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Who did you pay?</label>
            <select
              value={receiverId}
              onChange={(e) => {
                setReceiverId(e.target.value);
                setAmount('');
              }}
              className="w-full border rounded p-2"
              required
            >
              <option value="">Select person...</option>
              {pairwiseDebts.map(debt => (
                <option key={debt.creditorId} value={debt.creditorId}>
                  {debt.creditor.fullName} (You owe ${debt.amount.toFixed(2)})
                </option>
              ))}
            </select>
            {pairwiseDebts.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">You don't owe anyone right now.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={maxAmount || undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="0.00"
              required
              disabled={!receiverId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Note (Optional)</label>
            <input
              type="text"
              maxLength={255}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="e.g. Venmo"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              disabled={loading || !receiverId}
            >
              {loading ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
