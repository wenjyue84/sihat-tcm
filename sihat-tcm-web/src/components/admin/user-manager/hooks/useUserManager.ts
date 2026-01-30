"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { createClientServices } from "@/lib/services";
import { toast } from "sonner";
import { logger } from "@/lib/clientLogger";
import { UserProfile, RoleFilter, UserStats } from "../types";
import { ITEMS_PER_PAGE } from "../constants";
import { calculateBMI } from "../utils";

export function useUserManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Form State for editing patients
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      logger.error("UserManager", "Error fetching users", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleViewUser = useCallback((user: UserProfile) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  }, []);

  const handleEditUser = useCallback((user: UserProfile) => {
    if (user.role !== "patient") {
      toast.error("Only patient profiles can be edited");
      return;
    }
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name || "",
      age: user.age,
      gender: user.gender || "",
      height: user.height,
      weight: user.weight,
      bmi: user.bmi,
      medical_history: user.medical_history || "",
    });
    setIsEditDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedUser || selectedUser.role !== "patient") return;

    try {
      setSaving(true);

      const calculatedBmi = calculateBMI(formData.height, formData.weight);
      const bmiToSave = calculatedBmi ? parseFloat(calculatedBmi.toFixed(1)) : null;

      const dataToSave = {
        full_name: formData.full_name?.trim() || null,
        age: formData.age || null,
        gender: formData.gender || null,
        height: formData.height || null,
        weight: formData.weight || null,
        bmi: bmiToSave,
        medical_history: formData.medical_history || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await createClientServices().profiles.update(selectedUser.id, dataToSave);

      if (error) throw new Error(error.message);
      toast.success("Patient updated successfully");
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      logger.error("UserManager", "Error saving patient", error);
      toast.error("Failed to save patient");
    } finally {
      setSaving(false);
    }
  }, [selectedUser, formData, fetchUsers]);

  const handleDelete = useCallback(
    async (user: UserProfile) => {
      if (user.role !== "patient") {
        toast.error("Only patient accounts can be deleted");
        return;
      }

      if (
        !confirm(
          `Are you sure you want to delete ${user.full_name || "this patient"}? This action cannot be undone and will remove all their data including diagnosis history.`
        )
      )
        return;

      try {
        setDeleting(user.id);

        // First delete related inquiries
        await createClientServices().inquiries.deleteByUserId(user.id);

        // Then delete the profile
        const { error } = await createClientServices().profiles.delete(user.id);

        if (error) throw new Error(error.message);
        toast.success("Patient deleted successfully");
        fetchUsers();
      } catch (error) {
        logger.error("UserManager", "Error deleting patient", error);
        toast.error("Failed to delete patient. They may have associated records.");
      } finally {
        setDeleting(null);
      }
    },
    [fetchUsers]
  );

  // Filter users based on search query and role
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Paginate filtered results
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredUsers, currentPage]);

  // Stats
  const stats: UserStats = useMemo(
    () => ({
      total: users.length,
      patients: users.filter((u) => u.role === "patient").length,
      doctors: users.filter((u) => u.role === "doctor").length,
      admins: users.filter((u) => u.role === "admin").length,
      developers: users.filter((u) => u.role === "developer").length,
    }),
    [users]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleRoleFilterChange = useCallback((role: RoleFilter) => {
    setRoleFilter(role);
    setCurrentPage(1);
  }, []);

  return {
    // State
    users,
    loading,
    isViewDialogOpen,
    isEditDialogOpen,
    selectedUser,
    saving,
    deleting,
    searchQuery,
    roleFilter,
    currentPage,
    formData,
    filteredUsers,
    paginatedUsers,
    totalPages,
    stats,
    // Actions
    setIsViewDialogOpen,
    setIsEditDialogOpen,
    setFormData,
    setCurrentPage,
    handleViewUser,
    handleEditUser,
    handleSave,
    handleDelete,
    handleSearchChange,
    handleRoleFilterChange,
  };
}
