import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export default function GroupBalances({ groupId }) {
  const { data: balances, isLoading, isError, error } = useQuery({
    queryKey: ['balances', groupId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/groups/${groupId}/balances`);
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 animate-pulse rounded-md bg-muted"></div>
        <div className="h-64 animate-pulse rounded-md bg-muted"></div>
      </div>
    );
  }

  if (isError) {
    return <div className="text-destructive py-4 text-sm">{error?.response?.data?.error || 'Failed to load balances'}</div>;
  }

  if (!balances) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">Who owes whom</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {balances.pairwiseDebts.length === 0 ? (
            <p className="text-muted-foreground text-sm italic text-center py-4">All settled up!</p>
          ) : (
            <ul className="space-y-3">
              {balances.pairwiseDebts.map((debt, idx) => (
                <li key={idx} className="flex justify-between items-center bg-muted/30 p-3 rounded-md border">
                  <div className="text-sm">
                    <span className="font-medium text-foreground">{debt.debtor.fullName}</span> owes{' '}
                    <span className="font-medium text-foreground">{debt.creditor.fullName}</span>
                  </div>
                  <div className="font-semibold text-positive">
                    ₹{debt.amount.toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">Member Balances</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-3">
            {balances.memberBalances.map((mb, idx) => (
              <li key={idx} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/20 transition-colors">
                <span className="text-sm font-medium text-foreground">{mb.user.fullName}</span>
                <span className={`font-semibold ${mb.balance > 0 ? 'text-positive' : mb.balance < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {mb.balance > 0 ? '+' : ''}₹{mb.balance.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
