import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, ArrowUpRight, ArrowDownRight, Scale, AlertCircle, Plane, Home, Utensils, ShoppingCart } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import CreateGroupModal from '../components/CreateGroupModal';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';

const getGroupAvatar = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('trip')) return <Plane className="w-6 h-6 text-blue-500" />;
  if (lowerName.includes('home')) return <Home className="w-6 h-6 text-emerald-500" />;
  if (lowerName.includes('food')) return <Utensils className="w-6 h-6 text-orange-500" />;
  if (lowerName.includes('shopping')) return <ShoppingCart className="w-6 h-6 text-purple-500" />;
  
  const initials = name
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
    
  return <span className="text-lg font-bold text-muted-foreground">{initials}</span>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePrefetchGroup = (groupId) => {
    queryClient.prefetchQuery({
      queryKey: ['group', groupId],
      queryFn: async () => {
        const res = await api.get(`/api/v1/groups/${groupId}`);
        return res.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const { data: groups = [], isLoading: groupsLoading, isError: groupsError, refetch: refetchGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await api.get('/api/v1/groups');
      return res.data.groups;
    }
  });

  const { data: balances, isLoading: balancesLoading, isError: balancesError, refetch: refetchBalances } = useQuery({
    queryKey: ['balances', 'user'],
    queryFn: async () => {
      const res = await api.get('/api/v1/users/me/balances');
      return res.data;
    }
  });

  const isLoading = groupsLoading || balancesLoading;
  const isError = groupsError || balancesError;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Here's your financial overview.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        </div>
      </div>

        {/* Error State */}
        {isError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">Failed to load dashboard data. Please try again.</p>
            <Button variant="outline" size="sm" onClick={() => { refetchGroups(); refetchBalances(); }} className="ml-auto">Retry</Button>
          </div>
        )}

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">You Owe</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse rounded-md bg-muted"></div>
              ) : (
                <div className="text-2xl font-bold text-destructive">₹{balances?.totalOwe?.toFixed(2) || '0.00'}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">You are Owed</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-positive" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse rounded-md bg-muted"></div>
              ) : (
                <div className="text-2xl font-bold text-positive">₹{balances?.totalOwed?.toFixed(2) || '0.00'}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse rounded-md bg-muted"></div>
              ) : (
                <div className={`text-2xl font-bold ${balances?.netBalance > 0 ? 'text-positive' : balances?.netBalance < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {balances?.netBalance > 0 ? '+' : ''}₹{balances?.netBalance?.toFixed(2) || '0.00'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Groups */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold tracking-tight">Your Groups</h2>
          </div>
          
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
               {[1, 2, 3].map(i => (
                 <Card key={i} className="animate-pulse h-[132px] bg-muted/50 border-muted" />
               ))}
            </div>
          ) : !isError && groups.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
              <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <CardTitle className="mb-2">No groups yet</CardTitle>
              <CardDescription>Create a group to start tracking expenses.</CardDescription>
              <Button onClick={() => setIsModalOpen(true)} className="mt-6" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create your first group
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {groups.map(group => (
                <Link 
                  key={group.id} 
                  to={`/groups/${group.id}`} 
                  onMouseEnter={() => handlePrefetchGroup(group.id)}
                  className="block transition-all hover:-translate-y-1"
                >
                  <Card className="h-full flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="p-6 pb-4 flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0 border border-muted-foreground/10">
                        {getGroupAvatar(group.name)}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold tracking-tight leading-tight">{group.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                          {group.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                    <CardContent className="pt-0 pb-6 flex items-center text-xs font-medium text-muted-foreground">
                      <Users className="w-4 h-4 mr-1.5" />
                      {group._count?.members} Members
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      {isModalOpen && (
        <CreateGroupModal 
          onClose={() => setIsModalOpen(false)} 
          onCreated={(newGroup) => {
            setIsModalOpen(false);
            navigate(`/groups/${newGroup.id}`);
          }}
        />
      )}
    </div>
  );
}
