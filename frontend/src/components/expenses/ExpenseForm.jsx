import { useState, useEffect } from 'react';
import api from '../../lib/api';

const SPLIT_TYPES = ['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE'];
const CATEGORIES = ['FOOD', 'TRANSPORT', 'ACCOMMODATION', 'ENTERTAINMENT', 'UTILITIES', 'SHOPPING', 'OTHER'];

export default function ExpenseForm({ groupId, members, initialData, onSuccess, onCancel }) {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [paidById, setPaidById] = useState(initialData?.paidById || members[0]?.user?.id || '');
  const [category, setCategory] = useState(initialData?.category || 'OTHER');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [splitType, setSplitType] = useState(initialData?.splitType || 'EQUAL');
  
  // Participants state: array of { userId, selected, value }
  const [participants, setParticipants] = useState(() => {
    if (initialData && initialData.participants) {
      return members.map(m => {
        const p = initialData.participants.find(p => p.userId === m.user.id);
        return {
          userId: m.user.id,
          fullName: m.user.fullName,
          selected: !!p,
          value: p?.splitValue ? Number(p.splitValue) : ''
        };
      });
    }
    return members.map(m => ({
      userId: m.user.id,
      fullName: m.user.fullName,
      selected: true,
      value: ''
    }));
  });

  const toggleParticipant = (userId) => {
    setParticipants(prev => prev.map(p => 
      p.userId === userId ? { ...p, selected: !p.selected, value: '' } : p
    ));
  };

  const updateParticipantValue = (userId, val) => {
    setParticipants(prev => prev.map(p => 
      p.userId === userId ? { ...p, value: val } : p
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const activeParticipants = participants.filter(p => p.selected);
    if (activeParticipants.length === 0) {
      setError('Select at least one participant');
      return;
    }

    // Validate inputs based on split type before sending to server
    if (splitType === 'PERCENTAGE') {
      const sum = activeParticipants.reduce((acc, p) => acc + Number(p.value || 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        setError(`Percentages must sum to 100. Current sum: ${sum}`);
        return;
      }
    } else if (splitType === 'UNEQUAL') {
      const sum = activeParticipants.reduce((acc, p) => acc + Number(p.value || 0), 0);
      if (Math.abs(sum - Number(amount)) > 0.01) {
        setError(`Unequal amounts must sum to ${amount}. Current sum: ${sum}`);
        return;
      }
    }

    const payload = {
      title,
      amount: Number(amount),
      paidById,
      splitType,
      category,
      notes,
      participants: activeParticipants.map(p => ({
        userId: p.userId,
        value: splitType !== 'EQUAL' ? Number(p.value) : undefined
      }))
    };

    try {
      setLoading(true);
      if (isEdit) {
        await api.patch(`/api/v1/expenses/${initialData.id}`, payload);
      } else {
        await api.post(`/api/v1/groups/${groupId}/expenses`, payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input 
            type="text" required 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={title} onChange={e => setTitle(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
          <input 
            type="number" step="0.01" min="0.01" required 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={amount} onChange={e => setAmount(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Paid By</label>
          <select 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={paidById} onChange={e => setPaidById(e.target.value)}
          >
            {members.map(m => (
              <option key={m.user.id} value={m.user.id}>{m.user.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select 
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={category} onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Split Type</label>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {SPLIT_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setSplitType(type);
                setError('');
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${splitType === type ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-medium text-sm text-gray-700">
          Participants
        </div>
        <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
          {participants.map(p => (
            <div key={p.userId} className="flex items-center p-3 hover:bg-gray-50">
              <input 
                type="checkbox" 
                checked={p.selected} 
                onChange={() => toggleParticipant(p.userId)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className={`ml-3 flex-1 ${p.selected ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {p.fullName}
              </span>
              
              {p.selected && splitType !== 'EQUAL' && (
                <div className="ml-4 flex items-center">
                  <input
                    type="number"
                    step={splitType === 'SHARE' ? '1' : '0.01'}
                    min="0"
                    placeholder={splitType === 'PERCENTAGE' ? '%' : splitType === 'SHARE' ? 'shares' : '$'}
                    className="w-24 p-1 text-sm border rounded text-right focus:ring-2 focus:ring-blue-500"
                    value={p.value}
                    onChange={e => updateParticipantValue(p.userId, e.target.value)}
                    required
                  />
                  {splitType === 'PERCENTAGE' && <span className="ml-1 text-gray-500">%</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea 
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          value={notes} onChange={e => setNotes(e.target.value)} 
          rows="2"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button 
          type="button" onClick={onCancel}
          className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : 'Save Expense'}
        </button>
      </div>
    </form>
  );
}
