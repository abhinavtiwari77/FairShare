import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';

const SPLIT_TYPES = ['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE'];
const CATEGORIES = ['FOOD', 'TRANSPORT', 'ACCOMMODATION', 'ENTERTAINMENT', 'UTILITIES', 'SHOPPING', 'OTHER'];

export default function ExpenseForm({ groupId, members, initialData, onSuccess, onCancel, onClose }) {
  const isEdit = !!initialData;
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [paidById, setPaidById] = useState(initialData?.paidById || members[0]?.user?.id || '');
  const [category, setCategory] = useState(initialData?.category || 'OTHER');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [splitType, setSplitType] = useState(initialData?.splitType || 'EQUAL');
  
  // Handle both onCancel and onClose for compatibility
  const handleCancel = onCancel || onClose;

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

  const mutation = useMutation({
    mutationFn: async (payload) => {
      if (isEdit) {
        await api.patch(`/api/v1/expenses/${initialData.id}`, payload);
      } else {
        await api.post(`/api/v1/groups/${groupId}/expenses`, payload);
      }
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['expenses', groupId] });
      const previousExpenses = queryClient.getQueryData(['expenses', groupId]);
      
      const optimisticExpense = {
        id: isEdit ? initialData.id : `temp-${Date.now()}`,
        ...payload,
        paidBy: members.find(m => m.user.id === payload.paidById)?.user || { fullName: 'Unknown' },
        createdAt: isEdit ? initialData.createdAt : new Date().toISOString(),
      };

      queryClient.setQueryData(['expenses', groupId], (old) => {
        if (!old) return old;
        const newPages = [...old.pages];
        if (newPages.length > 0) {
          if (isEdit) {
            for (let i = 0; i < newPages.length; i++) {
              newPages[i] = {
                ...newPages[i],
                expenses: newPages[i].expenses.map(e => e.id === initialData.id ? optimisticExpense : e)
              };
            }
          } else {
            newPages[0] = {
              ...newPages[0],
              expenses: [optimisticExpense, ...newPages[0].expenses]
            };
          }
        }
        return { ...old, pages: newPages };
      });
      
      return { previousExpenses };
    },
    onError: (err, newExpense, context) => {
      queryClient.setQueryData(['expenses', groupId], context.previousExpenses);
      setError(err.response?.data?.error || 'Failed to save expense');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', 'user'] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['expense', initialData.id] });
      }
    },
    onSuccess: () => {
      onSuccess();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const activeParticipants = participants.filter(p => p.selected);
    if (activeParticipants.length === 0) {
      setError('Select at least one participant');
      return;
    }

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

    mutation.mutate(payload);
  };

  const loading = mutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input 
            type="text" required 
            value={title} onChange={e => setTitle(e.target.value)} 
            placeholder="e.g. Dinner"
          />
        </div>
        <div className="space-y-2">
          <Label>Amount ($)</Label>
          <Input 
            type="number" step="0.01" min="0.01" required 
            value={amount} onChange={e => setAmount(e.target.value)} 
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Paid By</Label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={paidById} onChange={e => setPaidById(e.target.value)}
          >
            {members.map(m => (
              <option key={m.user.id} value={m.user.id}>{m.user.fullName}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={category} onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Split Type</Label>
        <div className="flex bg-muted/50 p-1 rounded-md border">
          {SPLIT_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setSplitType(type);
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-sm transition-colors ${splitType === type ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="bg-muted/30 px-4 py-2 border-b font-medium text-sm text-foreground">
          Participants
        </div>
        <div className="divide-y max-h-60 overflow-y-auto">
          {participants.map(p => (
            <div key={p.userId} className="flex items-center p-3 hover:bg-muted/10 transition-colors">
              <input 
                type="checkbox" 
                checked={p.selected} 
                onChange={() => toggleParticipant(p.userId)}
                className="w-4 h-4 rounded border-input"
              />
              <span className={`ml-3 flex-1 text-sm ${p.selected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {p.fullName}
              </span>
              
              {p.selected && splitType !== 'EQUAL' && (
                <div className="ml-4 flex items-center">
                  <Input
                    type="number"
                    step={splitType === 'SHARE' ? '1' : '0.01'}
                    min="0"
                    placeholder={splitType === 'PERCENTAGE' ? '%' : splitType === 'SHARE' ? 'shares' : '$'}
                    className="w-24 h-8 px-2 text-sm text-right"
                    value={p.value}
                    onChange={e => updateParticipantValue(p.userId, e.target.value)}
                    required
                  />
                  {splitType === 'PERCENTAGE' && <span className="ml-2 text-sm text-muted-foreground">%</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <textarea 
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
          value={notes} onChange={e => setNotes(e.target.value)} 
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {handleCancel && (
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Expense'}
        </Button>
      </div>
    </form>
  );
}
