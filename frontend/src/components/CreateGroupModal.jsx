import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/Dialog';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Button } from './ui/Button';
import { Search, UserPlus, X } from 'lucide-react';

export default function CreateGroupModal({ onClose, onCreated }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [newMemberJoinedAt, setNewMemberJoinedAt] = useState(new Date().toISOString().split('T')[0]);
  const [initialMembers, setInitialMembers] = useState([]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/api/v1/groups', data);
      return res.data.group;
    },
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      onCreated(newGroup);
    },
    onError: (err) => {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to create group');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ 
      name, 
      description,
      members: initialMembers.map(m => ({ userId: m.user.id, joinedAt: new Date(m.joinedAt).toISOString() }))
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchResult(null);
    try {
      const res = await api.get(`/api/v1/users/search?email=${searchEmail}`);
      // Don't show if already added
      if (initialMembers.find(m => m.user.id === res.data.user.id)) {
        alert('User already added');
        return;
      }
      setSearchResult(res.data.user);
    } catch {
      alert('User not found');
    }
  };

  const handleAddMember = () => {
    if (!searchResult) return;
    setInitialMembers([...initialMembers, { user: searchResult, joinedAt: newMemberJoinedAt }]);
    setSearchEmail('');
    setSearchResult(null);
    setNewMemberJoinedAt(new Date().toISOString().split('T')[0]);
  };

  const removeInitialMember = (userId) => {
    setInitialMembers(initialMembers.filter(m => m.user.id !== userId));
  };

  const loading = mutation.isPending;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          <div className="px-4 pt-4">
            <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a group to track expenses with friends, family, or roommates.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ski Trip 2026"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
          </div>
          
          <div className="px-4 pb-4">
            <h4 className="text-sm font-semibold mb-3">Add Members (Optional)</h4>
            
            {initialMembers.length > 0 && (
              <ul className="mb-4 space-y-2">
                {initialMembers.map((m) => (
                  <li key={m.user.id} className="flex items-center justify-between bg-accent/50 p-2 rounded-md text-sm">
                    <div>
                      <p className="font-medium">{m.user.fullName}</p>
                      <p className="text-xs text-muted-foreground">Joined: {m.joinedAt}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => removeInitialMember(m.user.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2 mb-3">
              <Input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Search email"
                className="h-9"
              />
              <Button type="button" onClick={handleSearch} size="sm" className="h-9 px-3">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {searchResult && (
              <div className="flex flex-col gap-3 rounded-md border border-positive/30 bg-positive/10 p-3">
                <div className="truncate pr-2">
                  <p className="text-sm font-medium truncate">{searchResult.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{searchResult.email}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="newJoinedAt" className="text-xs">Joined:</Label>
                    <Input
                      id="newJoinedAt"
                      type="date"
                      value={newMemberJoinedAt}
                      onChange={(e) => setNewMemberJoinedAt(e.target.value)}
                      className="h-7 text-xs w-32 px-2"
                    />
                  </div>
                  <Button type="button" size="sm" onClick={handleAddMember} className="h-7 bg-positive text-positive-foreground hover:bg-positive/90">
                    <UserPlus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="px-4 pb-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
