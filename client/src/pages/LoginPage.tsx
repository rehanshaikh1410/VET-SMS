import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginPageProps {
  onLogin?: (username: string, role: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('http://localhost:5004/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: usernameOrEmail, password, role })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Verify role matches
      if (data.role !== role) {
        throw new Error('Invalid role for this account');
      }
      
      // Save the token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: data._id,
        username: data.username,
        role: data.role,
        name: data.name
      }));

      onLogin?.(data.username, data.role);
    } catch (error) {
      console.error('Login error:', error);
      const message = error instanceof Error ? error.message : 'Login failed';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Login</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role" data-testid="select-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="usernameOrEmail">Username or Email</Label>
            <Input
              id="usernameOrEmail"
              type="text"
              placeholder="Enter username or email"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              data-testid="input-username"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="input-password"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            data-testid="button-login"
          >
            Login
          </Button>
        </form>
      </Card>
    </div>
  );
}
