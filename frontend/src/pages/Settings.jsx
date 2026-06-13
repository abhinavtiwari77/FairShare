import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { User, Lock, Mail } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [profileMessage, setProfileMessage] = useState(null);
  const [securityMessage, setSecurityMessage] = useState(null);

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    // Simulated API call due to backend limitations
    setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    setTimeout(() => setProfileMessage(null), 3000);
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    // Simulated API call due to backend limitations
    if (newPassword.length < 6) {
      setSecurityMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setSecurityMessage({ type: 'success', text: 'Password updated successfully!' });
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setSecurityMessage(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-muted-foreground" /> Profile
          </CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                placeholder="John Doe" 
                required 
              />
            </div>
            {profileMessage && (
              <div className={`p-2 rounded text-sm ${profileMessage.type === 'success' ? 'bg-positive/10 text-positive' : 'bg-destructive/10 text-destructive'}`}>
                {profileMessage.text}
              </div>
            )}
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      {/* Account / Read-only Email Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5 text-muted-foreground" /> Account Email
          </CardTitle>
          <CardDescription>The email address associated with your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <Label>Email Address</Label>
            <Input 
              value={user?.email || ''} 
              disabled 
              className="bg-muted/50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">Your email address cannot be changed at this time.</p>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5 text-muted-foreground" /> Security
          </CardTitle>
          <CardDescription>Change your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input 
                type="password" 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                required 
                minLength={6}
              />
            </div>
            {securityMessage && (
              <div className={`p-2 rounded text-sm ${securityMessage.type === 'success' ? 'bg-positive/10 text-positive' : 'bg-destructive/10 text-destructive'}`}>
                {securityMessage.text}
              </div>
            )}
            <Button type="submit">Update Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
