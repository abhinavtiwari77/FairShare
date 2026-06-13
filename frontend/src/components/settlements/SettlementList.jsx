import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Trash2, Banknote } from 'lucide-react';
import { Button } from '../ui/Button';

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
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete payment');
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground p-8 text-center">Loading history...</div>;
  
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
              <span className="font-bold text-positive text-sm">${Number(s.amount).toFixed(2)}</span>
              {canDelete && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDelete(s.id)} 
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
