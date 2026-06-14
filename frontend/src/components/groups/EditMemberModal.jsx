import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';

export default function EditMemberModal({ groupId, member, onClose }) {
  const queryClient = useQueryClient();
  
  const [joinedAt, setJoinedAt] = useState(
    member.joinedAt ? new Date(member.joinedAt).toISOString().split('T')[0] : ''
  );
  
  const [isLeft, setIsLeft] = useState(!!member.leftAt);
  const [leftAt, setLeftAt] = useState(
    member.leftAt ? new Date(member.leftAt).toISOString().split('T')[0] : ''
  );

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.patch(`/api/v1/groups/${groupId}/members/${member.userId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      onClose();
    },
    onError: (err) => {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to update member');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      joinedAt: joinedAt ? new Date(joinedAt).toISOString() : undefined,
    };
    
    if (isLeft) {
      if (!leftAt) {
        alert('Please specify a left date');
        return;
      }
      payload.leftAt = new Date(leftAt).toISOString();
    } else {
      payload.leftAt = null;
    }

    mutation.mutate(payload);
  };

  const loading = mutation.isPending;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Membership: {member.user.fullName}</DialogTitle>
            <DialogDescription>
              Update when this member joined or left the group. Expenses outside these dates will automatically exclude them.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="joinedAt">Joined Date</Label>
              <Input
                id="joinedAt"
                type="date"
                value={joinedAt}
                onChange={(e) => setJoinedAt(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                id="isLeft" 
                checked={isLeft} 
                onChange={(e) => {
                  setIsLeft(e.target.checked);
                  if (e.target.checked && !leftAt) {
                    setLeftAt(new Date().toISOString().split('T')[0]);
                  }
                }} 
              />
              <Label htmlFor="isLeft">Member has left the group</Label>
            </div>

            {isLeft && (
              <div className="grid gap-2">
                <Label htmlFor="leftAt">Left Date</Label>
                <Input
                  id="leftAt"
                  type="date"
                  value={leftAt}
                  onChange={(e) => setLeftAt(e.target.value)}
                  required={isLeft}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
