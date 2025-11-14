import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import DataTable from "@/components/DataTable";

export default function AdminAccessibility() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "student",
    name: "",
    phone: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/users");
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/users', newUser);

      toast({
        title: "Success",
        description: `User ${newUser.username} created successfully! Share these credentials with them.`,
      });

      // Reset form and refresh users list
      setNewUser({
        username: "",
        password: "",
        role: "student",
        name: "",
        phone: "",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const columns = [
    { key: "username", label: "Username" },
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "phone", label: "Phone" },
  ];

  const handleDeleteUser = async (row: any) => {
    if (!confirm(`Delete user ${row.username}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${row._id}`);
      toast({ title: 'Deleted', description: 'User deleted' });
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to delete user', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">User Accessibility Management</h1>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create New User</h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={newUser.phone}
                onChange={(e) =>
                  setNewUser({ ...newUser, phone: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit">Create User</Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Manage Users</h2>
        <DataTable columns={columns} data={users} onDelete={handleDeleteUser} />
      </Card>
    </div>
  );
}