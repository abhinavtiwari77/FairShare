import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';

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
                  {debt.creditor.fullName} (You owe ${debt.amount.toFixed(2)})
                </option>
              ))}
            </select>
            {!fetching && pairwiseDebts.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">You don't owe anyone right now.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Amount ($)</Label>
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
