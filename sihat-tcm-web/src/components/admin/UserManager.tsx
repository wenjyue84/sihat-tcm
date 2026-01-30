"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Search } from "lucide-react";
import { useUserManager } from "./user-manager/hooks";
import {
  StatsOverview,
  UserTable,
  ViewUserDialog,
  EditUserDialog,
} from "./user-manager/components";
import { ITEMS_PER_PAGE } from "./user-manager/constants";

// Re-export types for backward compatibility
export type { UserProfile } from "./user-manager/types";

export function UserManager() {
  const {
    // Data
    users,
    loading,
    saving,
    deleting,
    // Dialog states
    isViewDialogOpen,
    setIsViewDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    selectedUser,
    // Form
    formData,
    setFormData,
    // Search/Filter
    searchQuery,
    roleFilter,
    handleSearchChange,
    handleRoleFilterChange,
    currentPage,
    setCurrentPage,
    // Computed values
    stats,
    filteredUsers,
    paginatedUsers,
    totalPages,
    // Handlers
    handleViewUser,
    handleEditUser,
    handleSave,
    handleDelete,
  } = useUserManager();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
            <CardDescription>View and manage all system users</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Overview */}
        <StatsOverview
          stats={stats}
          roleFilter={roleFilter}
          onRoleFilterChange={(role) => {
            handleRoleFilterChange(role);
          }}
        />

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => {
                handleSearchChange(e.target.value);
              }}
              className="pl-10"
            />
          </div>
        </div>

        {/* User Table */}
        <UserTable
          users={paginatedUsers}
          loading={loading}
          deleting={deleting}
          searchQuery={searchQuery}
          roleFilter={roleFilter}
          currentPage={currentPage}
          totalPages={totalPages}
          totalFiltered={filteredUsers.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onView={handleViewUser}
          onEdit={handleEditUser}
          onDelete={handleDelete}
          onPageChange={setCurrentPage}
        />
      </CardContent>

      {/* View Dialog */}
      <ViewUserDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        user={selectedUser}
        onEdit={handleEditUser}
      />

      {/* Edit Dialog */}
      <EditUserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormDataChange={setFormData}
        saving={saving}
        onSave={handleSave}
      />
    </Card>
  );
}
