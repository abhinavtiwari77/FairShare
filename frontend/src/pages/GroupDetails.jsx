import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Users, LogOut, Archive, Search, UserPlus } from 'lucide-react';
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
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [balancesKey, setBalancesKey] = useState(0);

  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  const fetchGroup = async () => {
    try {
      const res = await api.get(`/api/v1/groups/${groupId}`);
      setGroup(res.data.group);
      setMembers(res.data.members);
    } catch (err) {
      console.error(err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchGroup();
  }, [groupId]);

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

  const handleAddMember = async () => {
    if (!searchResult) return;
    try {
      await api.post(`/api/v1/groups/${groupId}/members`, { userId: searchResult.id });
      setSearchEmail('');
      setSearchResult(null);
      fetchGroup();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/api/v1/groups/${groupId}/members/${userId}`);
      fetchGroup();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleTransferAdmin = async (userId) => {
    if (!window.confirm('Make this user an admin?')) return;
    try {
      await api.patch(`/api/v1/groups/${groupId}/admin`, { userId });
      fetchGroup();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to transfer admin');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.post(`/api/v1/groups/${groupId}/leave`);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to leave group');
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this group?')) return;
    try {
      await api.delete(`/api/v1/groups/${groupId}`);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to archive group');
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  if (!group) return null;

  const currentMember = members.find(m => m.userId === user?.id);
  const isAdmin = currentMember?.role === 'ADMIN';
  const memberCount = members.length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <Button variant="link" onClick={() => navigate('/dashboard')} className="px-0 mb-2">
          &larr; Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
            {group.description && <p className="mt-1 text-muted-foreground">{group.description}</p>}
            <p className="mt-2 text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {memberCount} Members {isAdmin && '· Admin'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLeave} className="text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4 mr-2" /> Leave
            </Button>
            {isAdmin && (
              <Button variant="destructive" onClick={handleArchive}>
                <Archive className="w-4 h-4 mr-2" /> Archive
              </Button>
            )}
          </div>
        </div>

        {/* Main Content & Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="expenses" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="balances">Balances</TabsTrigger>
                <TabsTrigger value="settlements">Settlements</TabsTrigger>
              </TabsList>
              
              <div className="mt-6">
                <TabsContent value="expenses" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold tracking-tight">Expenses</h3>
                    <Button onClick={() => setShowExpenseModal(true)}>Add Expense</Button>
                  </div>
                  <Card>
                    <CardContent className="p-0">
                      <ExpenseList groupId={groupId} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="balances" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold tracking-tight">Balances</h3>
                    <Button variant="secondary" onClick={() => setShowSettlementModal(true)}>Settle Up</Button>
                  </div>
                  <GroupBalances 
                    groupId={groupId} 
                    key={balancesKey} 
                    onRecordPayment={() => setShowSettlementModal(true)} 
                  />
                </TabsContent>

                <TabsContent value="settlements">
                  <h3 className="text-xl font-semibold tracking-tight mb-4">Settlements</h3>
                  <Card>
                    <CardContent className="p-0">
                      <SettlementList groupId={groupId} keyProp={balancesKey} />
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
                setBalancesKey(prev => prev + 1); // refresh expenses & balances
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {showSettlementModal && (
        <RecordSettlementModal
          groupId={groupId}
          onClose={() => setShowSettlementModal(false)}
          onSettlementCreated={() => setBalancesKey(prev => prev + 1)}
        />
      )}
    </div>
  );
}
