import React, { useState, useEffect } from "react";
import { auth, api, Analysis, Payment, User, AI } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Shield, Plus, Edit, Trash2, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { PERMISSIONS, PERMISSION_LABELS, ROLE_TEMPLATES, hasPermission } from "@/components/utils/permissions";

export default function RoleManagement() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await auth.me();
      setCurrentUser(user);
      
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        navigate(createPageUrl("Dashboard"));
        return;
      }

      const [rolesData, usersData] = await Promise.all([
        api.Role.filter({}, "-created_date"),
        User.filter({}, "-created_date")
      ]);

      setRoles(rolesData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading data:", error);
      window.location.href = "/login";
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || [],
        is_active: role.is_active !== false
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: [],
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleUseTemplate = (template) => {
    setFormData({
      name: template.name,
      description: template.description,
      permissions: template.permissions,
      is_active: true
    });
  };

  const handlePermissionToggle = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (formData.permissions.length === 0) {
      toast.error("At least one permission is required");
      return;
    }

    setIsSaving(true);
    try {
      if (editingRole) {
        await api.Role.update(editingRole.id, formData);
        toast.success("Role updated successfully");
      } else {
        await api.Role.create(formData);
        toast.success("Role created successfully");
      }
      
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error saving role:", error);
      toast.error("Failed to save role");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (role) => {
    const usersWithRole = users.filter(u => u.custom_role_id === role.id);
    
    if (usersWithRole.length > 0) {
      toast.error(`Cannot delete role. ${usersWithRole.length} user(s) are assigned to this role.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      return;
    }

    try {
      await api.Role.delete(role.id);
      toast.success("Role deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("Failed to delete role");
    }
  };

  const getUserCountForRole = (roleId) => {
    return users.filter(u => u.custom_role_id === roleId).length;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
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
              Role & Permission Management
            </h1>
            <p className="text-slate-600 mt-1">Create and manage custom roles with specific permissions</p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
        </div>

        {/* Quick Templates */}
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Quick Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {Object.values(ROLE_TEMPLATES).map((template, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-purple-200">
                <h3 className="font-semibold text-slate-800 mb-2">{template.name}</h3>
                <p className="text-sm text-slate-600 mb-3">{template.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {template.permissions.slice(0, 3).map(perm => (
                    <Badge key={perm} variant="outline" className="text-xs">
                      {PERMISSION_LABELS[perm]}
                    </Badge>
                  ))}
                  {template.permissions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.permissions.length - 3} more
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleOpenDialog();
                    setTimeout(() => handleUseTemplate(template), 100);
                  }}
                  className="w-full"
                >
                  Use Template
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Existing Roles */}
        <div className="grid md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="border-2 border-slate-200 hover:border-purple-300 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="w-5 h-5 text-purple-600" />
                      {role.name}
                    </CardTitle>
                    {role.description && (
                      <p className="text-sm text-slate-600 mt-2">{role.description}</p>
                    )}
                  </div>
                  {role.is_active && (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Permissions:</p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions?.map(perm => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        {PERMISSION_LABELS[perm] || perm}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-600 pt-2 border-t">
                  <UsersIcon className="w-4 h-4" />
                  <span>{getUserCountForRole(role.id)} user(s) assigned</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(role)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(role)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {roles.length === 0 && (
          <Card className="border-2 border-slate-200">
            <CardContent className="text-center py-12">
              <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Roles Created</h3>
              <p className="text-slate-600 mb-6">Start by creating a role or using one of the quick templates above</p>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Role
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Finance Manager"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this role can do..."
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Permissions *</Label>
              <div className="border rounded-lg p-4 space-y-3 bg-slate-50">
                {Object.entries(PERMISSIONS).map(([key, permission]) => (
                  <div key={permission} className="flex items-center space-x-3">
                    <Checkbox
                      id={permission}
                      checked={formData.permissions.includes(permission)}
                      onCheckedChange={() => handlePermissionToggle(permission)}
                    />
                    <Label
                      htmlFor={permission}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {PERMISSION_LABELS[permission]}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Selected: {formData.permissions.length} permission(s)
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2 border-t">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Role is active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSaving ? 'Saving...' : (editingRole ? 'Update Role' : 'Create Role')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}