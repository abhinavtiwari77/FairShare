import { Link } from 'react-router-dom';
import { useInfiniteQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button } from '../ui/Button';

export default function ExpenseList({ groupId }) {
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ['expenses', groupId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(`/api/v1/groups/${groupId}/expenses?page=${pageParam}&limit=10`);
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    placeholderData: keepPreviousData,
  });

  const handlePrefetch = (expenseId) => {
    queryClient.prefetchQuery({
      queryKey: ['expense', expenseId],
      queryFn: async () => {
        const res = await api.get(`/api/v1/groups/${groupId}/expenses/${expenseId}`);
        return res.data;
      },
      staleTime: 5 * 60 * 1000,
    });
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

  if (isError) {
    return <div className="text-destructive p-4 text-sm">{error?.response?.data?.error || 'Failed to load expenses'}</div>;
  }

  const expenses = data?.pages.flatMap(page => page.expenses) || [];

  if (expenses.length === 0) {
    return <div className="text-muted-foreground text-sm text-center p-12 bg-muted/20 rounded-md border border-dashed">No expenses yet. Add one to get started!</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="divide-y divide-border">
        {expenses.map(expense => (
          <Link 
            key={expense.id} 
            to={`/groups/${groupId}/expenses/${expense.id}`}
            onMouseEnter={() => handlePrefetch(expense.id)}
            className="block p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-sm">{expense.title}</h4>
                <p className="text-xs text-muted-foreground">
                  Paid by <span className="font-medium text-foreground">{expense.paidBy.fullName}</span> on {new Date(expense.expenseDate || expense.createdAt).toLocaleDateString()}
                </p>
                {expense.category && (
                  <span className="inline-block mt-2 text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium tracking-wide">
                    {expense.category}
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-foreground">₹{Number(expense.amount).toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase font-medium tracking-wider">{expense.splitType}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {hasNextPage && (
        <div className="p-4 border-t">
          <Button 
            variant="secondary"
            className="w-full"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
