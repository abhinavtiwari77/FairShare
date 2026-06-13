import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseChat from '../components/expenses/ExpenseChat';

export default function ExpenseDetails() {
  const { groupId, expenseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [expenseData, setExpenseData] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExpense = async () => {
    try {
      setLoading(true);
      const [expRes, grpRes] = await Promise.all([
        api.get(`/api/v1/expenses/${expenseId}`),
        api.get(`/api/v1/groups/${groupId}`)
      ]);
      setExpenseData(expRes.data);
      setGroupMembers(grpRes.data.members);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load expense details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpense();
  }, [expenseId, groupId]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) return;
    
    try {
      setIsDeleting(true);
      await api.delete(`/api/v1/expenses/${expenseId}`);
      navigate(`/groups/${groupId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete expense');
      setIsDeleting(false);
    }
  };

  if (loading && !expenseData) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (error && !expenseData) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
        <button onClick={() => navigate(`/groups/${groupId}`)} className="mt-4 text-blue-600 hover:underline">
          &larr; Back to Group
        </button>
      </div>
    );
  }

  const { expense, participants, splits, creator, payer } = expenseData;
  const currentMember = groupMembers.find(m => m.user.id === user.id);
  const canEditOrDelete = creator.id === user.id || currentMember?.role === 'ADMIN';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <button 
        onClick={() => navigate(`/groups/${groupId}`)} 
        className="mb-6 text-gray-500 hover:text-gray-900 flex items-center transition-colors"
      >
        <span className="mr-2">&larr;</span> Back to Group
      </button>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Expense Details */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          {isEditing ? (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Expense</h2>
              <ExpenseForm 
                groupId={groupId}
                members={groupMembers}
                initialData={{ ...expense, participants }}
                onSuccess={() => {
                  setIsEditing(false);
                  fetchExpense();
                }}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          ) : (
            <div>
              {/* Header section */}
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{expense.title}</h1>
                  <p className="text-gray-500 mt-1">
                    Added by <span className="font-medium text-gray-700">{creator.fullName}</span> on {new Date(expense.createdAt).toLocaleDateString()}
                  </p>
                  {expense.category && (
                    <span className="inline-block mt-3 text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-medium uppercase tracking-wide">
                      {expense.category}
                    </span>
                  )}
                </div>
                <div className="text-left md:text-right">
                  <div className="text-3xl font-black text-gray-900">${Number(expense.amount).toFixed(2)}</div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide font-bold mt-1">Paid by {payer.fullName}</div>
                </div>
              </div>

              {/* Notes */}
              {expense.notes && (
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Notes</h3>
                  <p className="text-gray-800">{expense.notes}</p>
                </div>
              )}

              {/* Splits visualization */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Split Details <span className="text-sm font-normal text-gray-500 ml-2">({expense.splitType})</span>
                </h3>
                
                <div className="space-y-3">
                  {splits.map(split => {
                    const participant = participants.find(p => p.userId === split.user.id);
                    const isPayer = split.user.id === payer.id;
                    
                    return (
                      <div key={split.userId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                            {split.user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {split.user.fullName} {user.id === split.user.id && <span className="text-gray-400 font-normal">(You)</span>}
                            </p>
                            {participant?.splitValue !== null && expense.splitType !== 'EQUAL' && (
                              <p className="text-xs text-gray-500">
                                Input value: {Number(participant.splitValue)} {expense.splitType === 'PERCENTAGE' ? '%' : expense.splitType === 'SHARE' ? 'shares' : '$'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">Owes ${Number(split.amountOwed).toFixed(2)}</p>
                          {isPayer && (
                            <p className="text-xs text-green-600 font-bold uppercase mt-1 tracking-wide">Paid ${Number(expense.amount).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              {canEditOrDelete && (
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Edit Expense
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Expense'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Chat section */}
        <div className="lg:col-span-1">
          <ExpenseChat expenseId={expenseId} isAdmin={currentMember?.role === 'ADMIN'} />
        </div>
      </div>
    </div>
  );
}
