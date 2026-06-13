import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';

export default function RecordSettlementModal({ groupId, onClose, onSettlementCreated }) {
  const queryClient = useQueryClient();
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const { data: balances, isLoading: fetching } = useQuery({
    queryKey: ['balances', groupId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/groups/${groupId}/balances`);
      return data;
    }
  });

  const pairwiseDebts = balances?.pairwiseDebts || [];
  const selectedDebt = pairwiseDebts.find(d => d.creditorId === receiverId);
  const maxAmount = selectedDebt ? selectedDebt.amount : 0;

  const settlementMutation = useMutation({
    mutationFn: async (data) => api.post(`/api/v1/groups/${groupId}/settlements`, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['settlements', groupId] });
      const previousSettlements = queryClient.getQueryData(['settlements', groupId]);

      const optimisticSettlement = {
        id: `temp-${Date.now()}`,
        amount: data.amount,
        note: data.note,
        createdAt: new Date().toISOString(),
        status: 'COMPLETED',
        payer: { fullName: 'You' },
        receiver: { fullName: 'Receiver' } // Best effort optimisim
      };

      queryClient.setQueryData(['settlements', groupId], (old) => {
        if (!old) return [optimisticSettlement];
        return [optimisticSettlement, ...old];
      });

      onClose(); // Optimistically close the modal immediately
      
      return { previousSettlements };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['settlements', groupId], context.previousSettlements);
      alert(err.response?.data?.error || 'Failed to record settlement');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
      onSettlementCreated();
    }
  });

  const handleSubmit = (e) => {
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
      setError(`Cannot settle more than the owed amount (₹${maxAmount.toFixed(2)})`);
      return;
    }

    setError('');
    settlementMutation.mutate({
      receiverId,
      amount: numAmount,
      note
    });
  };

  const loading = settlementMutation.isPending;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record a Payment</DialogTitle>
          <DialogDescription>Settle up your debts with group members.</DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Who did you pay?</Label>
            <select
              value={receiverId}
              onChange={(e) => {
                setReceiverId(e.target.value);
                setAmount('');
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Select person...</option>
              {pairwiseDebts.map(debt => (
                <option key={debt.creditorId} value={debt.creditorId}>
                  {debt.creditor.fullName} (You owe ₹{debt.amount.toFixed(2)})
                </option>
              ))}
            </select>
            {!fetching && pairwiseDebts.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">You don't owe anyone right now.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={maxAmount || undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              disabled={!receiverId}
            />
          </div>

          <div className="space-y-2">
            <Label>Note (Optional)</Label>
            <Input
              type="text"
              maxLength={255}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Venmo"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !receiverId}
            >
              {loading ? 'Saving...' : 'Save Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
