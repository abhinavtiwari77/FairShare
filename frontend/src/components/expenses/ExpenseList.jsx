import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

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
    return <div className="text-center p-4">Loading expenses...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (expenses.length === 0) {
    return <div className="text-gray-500 text-center p-8 bg-gray-50 rounded-lg">No expenses yet. Add one to get started!</div>;
  }

  return (
    <div className="space-y-4">
      {expenses.map(expense => (
        <Link 
          key={expense.id} 
          to={`/groups/${groupId}/expenses/${expense.id}`}
          className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-gray-800 text-lg">{expense.title}</h4>
              <p className="text-sm text-gray-500">
                Paid by <span className="font-medium text-gray-700">{expense.paidBy.fullName}</span> on {new Date(expense.createdAt).toLocaleDateString()}
              </p>
              {expense.category && (
                <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  {expense.category}
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">${Number(expense.amount).toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1 uppercase font-semibold">{expense.splitType}</div>
            </div>
          </div>
        </Link>
      ))}
      
      {hasMore && (
        <button 
          onClick={loadMore}
          disabled={loading}
          className="w-full py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
