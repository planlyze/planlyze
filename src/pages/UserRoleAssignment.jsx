import React, { useState, useEffect } from "react";
import { auth, api, Analysis, Payment, User, AI } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Shield, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { PERMISSION_LABELS } from "@/components/utils/permissions";
import { auditLogger } from "@/components/utils/auditLogger";

export default function UserRoleAssignment() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);

  useEffect(() => {
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      if (user.role !== 'admin') {
        navigate(createPageUrl("Dashboard"));
        return;
      }

      const [usersData, rolesData] = await Promise.all([
        User.filter({}, "-created_date"),
        api.Role.filter({ is_active: true }, "name")
      ]);

      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Error loading data:", error);
      window.location.href = "/login";
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId, roleId, roleName) => {
    setUpdatingUserId(userId);
    try {
      const selectedRole = roles.find(r => r.id === roleId);
      
      await User.update(userId, {
        custom_role_id: roleId || null,
        permissions: selectedRole?.permissions || []
      });

      // Log role assignment
      const currentAdmin = await auth.me();
      const targetUser = users.find(u => u.id === userId);
      await auditLogger.logRoleAssignment(
        currentAdmin.email,
        targetUser.email,
        roleName || 'User',
        selectedRole?.permissions || []
      );

      toast.success(`Role updated to ${roleName || 'User'}`);
      loadData();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleName = (user) => {
    if (user.role === 'admin') return 'Super Admin';
    if (user.custom_role_id) {
      const role = roles.find(r => r.id === user.custom_role_id);
      return role?.name || 'Custom Role';
    }
    return 'User';
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-800">
              User Role Assignment
            </h1>
            <p className="text-slate-600 mt-1">Assign roles to users to control their permissions</p>
          </div>
        </div>

        {/* Search */}
        <Card className="border-2 border-slate-200">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Assign Role</TableHead>
                  <TableHead>Permissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-800">{user.full_name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : user.custom_role_id
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                      }>
                        {getRoleName(user)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.role === 'admin' ? (
                        <span className="text-sm text-slate-500">Cannot modify super admin</span>
                      ) : (
                        <Select
                          value={user.custom_role_id || 'none'}
                          onValueChange={(value) => {
                            const roleId = value === 'none' ? null : value;
                            const roleName = value === 'none' ? 'User' : roles.find(r => r.id === value)?.name;
                            handleRoleChange(user.id, roleId, roleName);
                          }}
                          disabled={updatingUserId === user.id}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">User (No Role)</SelectItem>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.permissions && user.permissions.length > 0 ? (
                        <span className="text-sm text-slate-600">
                          {user.permissions.length} permission(s)
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}