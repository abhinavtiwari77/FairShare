import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../ui/Button';

export default function ExpenseList({ groupId }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchExpenses = async (currentPage) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/groups/${groupId}/expenses?page=${currentPage}&limit=10`);
      if (currentPage === 1) {
        setExpenses(res.data.expenses);
      } else {
        setExpenses(prev => [...prev, ...res.data.expenses]);
      }
      setHasMore(res.data.pagination.page < res.data.pagination.totalPages);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses(1);
  }, [groupId]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchExpenses(nextPage);
  };

  if (loading && page === 1) {
    return <div className="text-center p-8 text-sm text-muted-foreground">Loading expenses...</div>;
  }

  if (error) {
    return <div className="text-destructive p-4 text-sm">{error}</div>;
  }

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
            className="block p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-sm">{expense.title}</h4>
                <p className="text-xs text-muted-foreground">
                  Paid by <span className="font-medium text-foreground">{expense.paidBy.fullName}</span> on {new Date(expense.createdAt).toLocaleDateString()}
                </p>
                {expense.category && (
                  <span className="inline-block mt-2 text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium tracking-wide">
                    {expense.category}
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-foreground">${Number(expense.amount).toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase font-medium tracking-wider">{expense.splitType}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {hasMore && (
        <div className="p-4 border-t">
          <Button 
            variant="secondary"
            className="w-full"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
