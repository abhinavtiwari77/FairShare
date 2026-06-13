import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Archive, Search, UserPlus, Receipt, Banknote } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import ExpenseList from '../components/expenses/ExpenseList';
import ExpenseForm from '../components/expenses/ExpenseForm';
import GroupBalances from '../components/balances/GroupBalances';
import SettlementList from '../components/settlements/SettlementList';
import RecordSettlementModal from '../components/settlements/RecordSettlementModal';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/groups/${groupId}`);
      return res.data;
    },
    retry: false,
  });

  const addMemberMutation = useMutation({
    mutationFn: async (userId) => api.post(`/api/v1/groups/${groupId}/members`, { userId }),
    onSuccess: () => {
      setSearchEmail('');
      setSearchResult(null);
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    },
    onError: (err) => alert(err.response?.data?.error || 'Failed to add member'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId) => api.delete(`/api/v1/groups/${groupId}/members/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group', groupId] }),
    onError: (err) => alert(err.response?.data?.error || 'Failed to remove member'),
  });

  const transferAdminMutation = useMutation({
    mutationFn: async (userId) => api.patch(`/api/v1/groups/${groupId}/admin`, { userId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group', groupId] }),
    onError: (err) => alert(err.response?.data?.error || 'Failed to transfer admin'),
  });

  const leaveMutation = useMutation({
    mutationFn: async () => api.post(`/api/v1/groups/${groupId}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigate('/dashboard');
    },
    onError: (err) => alert(err.response?.data?.error || 'Failed to leave group'),
  });

  const archiveMutation = useMutation({
    mutationFn: async () => api.delete(`/api/v1/groups/${groupId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigate('/dashboard');
    },
    onError: (err) => alert(err.response?.data?.error || 'Failed to archive group'),
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchResult(null);
    try {
      const res = await api.get(`/api/v1/users/search?email=${searchEmail}`);
      setSearchResult(res.data.user);
    } catch {
      alert('User not found');
    }
  };

  const handleAddMember = () => {
    if (!searchResult) return;
    addMemberMutation.mutate(searchResult.id);
  };

  const handleRemoveMember = (userId) => {
    if (!window.confirm('Remove this member?')) return;
    removeMemberMutation.mutate(userId);
  };

  const handleTransferAdmin = (userId) => {
    if (!window.confirm('Make this user an admin?')) return;
    transferAdminMutation.mutate(userId);
  };

  const handleLeave = () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    leaveMutation.mutate();
  };

  const handleArchive = () => {
    if (!window.confirm('Are you sure you want to archive this group?')) return;
    archiveMutation.mutate();
  };

  if (isError) {
    return <div className="p-8 text-destructive">Failed to load group: {error?.message} - {error?.response?.data?.error}</div>;
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background p-8 flex flex-col gap-8 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
        <div className="h-32 w-full bg-muted animate-pulse rounded-lg"></div>
        <div className="h-64 w-full bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  const { group, members } = data;
  const currentMember = members.find(m => m.userId === user?.id);
  const isAdmin = currentMember?.role === 'ADMIN';
  
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-300">
        
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
        <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span className="opacity-50">/</span>
        <span className="text-foreground">{group.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 -mt-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Group</span>
            {isAdmin && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">ADMIN</span>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{group.name}</h1>
          {group.description && <p className="text-muted-foreground mt-2 max-w-2xl">{group.description}</p>}
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={handleArchive} className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10">
              <Archive className="w-4 h-4" /> Archive
            </Button>
          )}
          <Button variant="outline" onClick={handleLeave} className="gap-2">
            <LogOut className="w-4 h-4" /> Leave
          </Button>
        </div>
      </div>

        {/* Main Content & Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="expenses" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="balances">Balances & Settlements</TabsTrigger>
              </TabsList>
              
              <div className="mt-6">
                <TabsContent value="expenses" className="mt-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <h2 className="text-xl font-bold tracking-tight">Group Expenses</h2>
                    <Button onClick={() => setShowExpenseModal(true)} className="gap-2">
                      <Receipt className="w-4 h-4" /> Add Expense
                    </Button>
                  </div>
                  <Card>
                    <ExpenseList groupId={groupId} />
                  </Card>
                </TabsContent>

                <TabsContent value="balances" className="mt-6 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <h2 className="text-xl font-bold tracking-tight">Balances & Settlements</h2>
                    <Button onClick={() => setShowSettlementModal(true)} className="gap-2">
                      <Banknote className="w-4 h-4" /> Record Payment
                    </Button>
                  </div>
                  
                  <GroupBalances groupId={groupId} />
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Payment History</CardTitle>
                      <CardDescription>Recent settlements between group members.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SettlementList groupId={groupId} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Sidebar / Members Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Members</CardTitle>
                <CardDescription>People in this group</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="divide-y divide-border -mx-6 px-6">
                  {members.map(m => (
                    <li key={m.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-sm">{m.user.fullName} {m.userId === user.id && <span className="text-muted-foreground font-normal">(You)</span>}</p>
                        <p className="text-xs text-muted-foreground">{m.user.email} · {m.role}</p>
                      </div>
                      {isAdmin && m.userId !== user.id && (
                        <div className="flex gap-2">
                          {m.role !== 'ADMIN' && (
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => handleTransferAdmin(m.userId)}>Admin</Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-destructive hover:text-destructive" onClick={() => handleRemoveMember(m.userId)}>Remove</Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                {isAdmin && (
                  <div className="pt-4 mt-4 border-t">
                    <h4 className="text-sm font-semibold mb-3">Add Member</h4>
                    <form onSubmit={handleSearch} className="flex gap-2 mb-3">
                      <Input
                        type="email"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        placeholder="Search email"
                        className="h-9"
                        required
                      />
                      <Button type="submit" size="sm" className="h-9 px-3">
                        <Search className="w-4 h-4" />
                      </Button>
                    </form>

                    {searchResult && (
                      <div className="flex items-center justify-between rounded-md border border-positive/30 bg-positive/10 p-3">
                        <div className="truncate pr-2">
                          <p className="text-sm font-medium truncate">{searchResult.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{searchResult.email}</p>
                        </div>
                        <Button size="sm" onClick={handleAddMember} className="bg-positive text-positive-foreground hover:bg-positive/90">
                          <UserPlus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>

      {showExpenseModal && (
        <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
              <DialogDescription>Add a new expense to the group.</DialogDescription>
            </DialogHeader>
            <ExpenseForm 
              groupId={groupId} 
              members={members}
              onClose={() => setShowExpenseModal(false)}
              onSuccess={() => {
                setShowExpenseModal(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {showSettlementModal && (
        <RecordSettlementModal
          groupId={groupId}
          onClose={() => setShowSettlementModal(false)}
          onSettlementCreated={() => {}}
        />
      )}
    </div>
  );
}
