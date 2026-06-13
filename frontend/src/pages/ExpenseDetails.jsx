import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Info, Trash2, Edit2, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseChat from '../components/expenses/ExpenseChat';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function ExpenseDetails() {
  const { groupId, expenseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: async () => {
      const [expRes, grpRes] = await Promise.all([
        api.get(`/api/v1/expenses/${expenseId}`),
        api.get(`/api/v1/groups/${groupId}`)
      ]);
      return { expenseData: expRes.data, groupMembers: grpRes.data.members };
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/api/v1/expenses/${expenseId}`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['expenses', groupId] });
      const previousExpenses = queryClient.getQueryData(['expenses', groupId]);

      queryClient.setQueryData(['expenses', groupId], (old) => {
        if (!old) return old;
        const newPages = [...old.pages];
        for (let i = 0; i < newPages.length; i++) {
          newPages[i] = {
            ...newPages[i],
            expenses: newPages[i].expenses.filter(e => e.id !== expenseId)
          };
        }
        return { ...old, pages: newPages };
      });
      
      // Navigate immediately for optimistic UI feel
      navigate(`/groups/${groupId}`);
      
      return { previousExpenses };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['expenses', groupId], context.previousExpenses);
      alert(err.response?.data?.error || 'Failed to delete expense');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', 'user'] });
    }
  });

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) return;
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">{error?.response?.data?.error || 'Failed to load expense'}</div>
        <Button variant="link" onClick={() => navigate(`/groups/${groupId}`)} className="mt-4 px-0">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Group
        </Button>
      </div>
    );
  }

  const { expenseData, groupMembers } = data;
  const { expense, participants, splits, creator, payer } = expenseData;
  const currentMember = groupMembers.find(m => m.user.id === user.id);
  const canEditOrDelete = creator.id === user.id || currentMember?.role === 'ADMIN';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <Button variant="link" onClick={() => navigate(`/groups/${groupId}`)} className="px-0">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Group
      </Button>

      {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm mb-6">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Expense Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="overflow-hidden">
            {isEditing ? (
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6">Edit Expense</h2>
                <ExpenseForm 
                  groupId={groupId}
                  members={groupMembers}
                  initialData={{ ...expense, participants }}
                  onSuccess={() => {
                    setIsEditing(false);
                  }}
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            ) : (
              <div>
                <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">{expense.title}</h1>
                    <div className="flex items-center text-sm text-muted-foreground gap-3">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(expense.createdAt).toLocaleDateString()}</span>
                      <span>Added by {creator.fullName}</span>
                    </div>
                    {expense.category && (
                      <span className="inline-block mt-2 text-xs bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full font-medium">
                        {expense.category}
                      </span>
                    )}
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-3xl font-black">${Number(expense.amount).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground mt-1">Paid by <span className="font-medium text-foreground">{payer.fullName}</span></div>
                  </div>
                </div>

                {expense.notes && (
                  <div className="p-6 border-b bg-muted/10 text-sm">
                    <div className="flex items-center gap-2 font-medium text-muted-foreground mb-2">
                      <Info className="w-4 h-4" /> Notes
                    </div>
                    <p className="text-foreground">{expense.notes}</p>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Split Details</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-secondary text-secondary-foreground rounded-md uppercase tracking-wider">{expense.splitType}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {splits.map(split => {
                      const participant = participants.find(p => p.userId === split.user.id);
                      const isPayer = split.user.id === payer.id;
                      const isMe = user.id === split.user.id;
                      
                      return (
                        <div key={split.userId} className="flex items-center justify-between p-3 bg-muted/20 rounded-md border">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {split.user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {split.user.fullName} {isMe && <span className="text-muted-foreground font-normal">(You)</span>}
                              </p>
                              {participant?.splitValue !== null && expense.splitType !== 'EQUAL' && (
                                <p className="text-xs text-muted-foreground">
                                  {Number(participant.splitValue)} {expense.splitType === 'PERCENTAGE' ? '%' : expense.splitType === 'SHARE' ? 'shares' : '$'}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">Owes ${Number(split.amountOwed).toFixed(2)}</p>
                            {isPayer && (
                              <p className="text-[10px] text-positive font-bold uppercase mt-0.5 tracking-wider">Paid ${Number(expense.amount).toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {canEditOrDelete && (
                  <div className="p-4 bg-muted/20 border-t flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending}>
                      <Trash2 className="w-4 h-4 mr-2" /> {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Chat section */}
        <div className="lg:col-span-1">
          <ExpenseChat expenseId={expenseId} isAdmin={currentMember?.role === 'ADMIN'} />
        </div>
      </div>
    </div>
  );
}
