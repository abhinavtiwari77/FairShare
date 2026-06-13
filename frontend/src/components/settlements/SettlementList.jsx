import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Trash2, Banknote } from 'lucide-react';
import { Button } from '../ui/Button';

export default function SettlementList({ groupId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: settlements = [], isLoading, isError, error } = useQuery({
    queryKey: ['settlements', groupId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/groups/${groupId}/settlements`);
      return data.settlements;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/api/v1/groups/${groupId}/settlements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', 'user'] });
    },
    onError: (err) => {
      alert(err.response?.data?.error || 'Failed to delete payment');
    }
  });

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 w-full animate-pulse rounded-md bg-muted"></div>
        ))}
      </div>
    );
  }
  
  if (isError) return <div className="text-destructive p-4 text-sm">{error?.response?.data?.error || 'Failed to load settlements'}</div>;

  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-dashed">
        <Banknote className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
        <p className="text-sm text-muted-foreground">No payment history.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {settlements.map(s => {
        const isCreator = s.createdBy.id === user.id;
        const isPayer = s.payer.id === user.id;
        const isReceiver = s.receiver.id === user.id;
        const canDelete = isCreator || isPayer || isReceiver;

        return (
          <div key={s.id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium text-foreground">{s.payer.fullName}</span> paid <span className="font-medium text-foreground">{s.receiver.fullName}</span>
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {new Date(s.createdAt).toLocaleDateString()} {s.note && <span>&middot; {s.note}</span>}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-positive text-sm">₹{Number(s.amount).toFixed(2)}</span>
              {canDelete && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDelete(s.id)} 
                  disabled={deleteMutation.isPending}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  title="Delete Payment"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
