"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { createClientServices } from "@/lib/services";
import { toast } from "sonner";
import { logger } from "@/lib/clientLogger";
import { ITEMS_PER_PAGE, INITIAL_FORM_DATA } from "../constants";
import { filterPatients, paginatePatients, calculatePatientStats } from "../utils";
import type { Patient, PatientFormData } from "../types";

export function usePatientManager() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<PatientFormData>(INITIAL_FORM_DATA);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "patient")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      logger.error("PatientManager", "Error fetching patients", error);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleOpenDialog = useCallback((patient?: Patient) => {
    if (patient) {
      setEditingId(patient.id);
      setFormData({
        full_name: patient.full_name || "",
        age: patient.age,
        gender: patient.gender || "",
        height: patient.height,
        weight: patient.weight,
        medical_history: patient.medical_history || "",
        role: patient.role,
      });
    } else {
      setEditingId(null);
      setFormData(INITIAL_FORM_DATA);
    }
    setIsDialogOpen(true);
  }, []);

  const handleViewPatient = useCallback((patient: Patient) => {
    setViewingPatient(patient);
    setIsViewDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.full_name?.trim()) {
      toast.error("Patient name is required");
      return;
    }

    try {
      setSaving(true);

      const dataToSave = {
        full_name: formData.full_name?.trim(),
        age: formData.age || null,
        gender: formData.gender || null,
        height: formData.height || null,
        weight: formData.weight || null,
        medical_history: formData.medical_history || null,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await createClientServices().profiles.update(editingId, dataToSave);

        if (error) throw new Error(error.message);
        toast.success("Patient updated successfully");
      } else {
        toast.error(
          "Creating new patients requires user registration. Please edit existing patients."
        );
        setSaving(false);
        return;
      }

      setIsDialogOpen(false);
      fetchPatients();
    } catch (error) {
      logger.error("PatientManager", "Error saving patient", error);
      toast.error("Failed to save patient");
    } finally {
      setSaving(false);
    }
  }, [formData, editingId, fetchPatients]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (
        !confirm(
          "Are you sure you want to delete this patient? This action cannot be undone and will remove all their data including diagnosis history."
        )
      )
        return;

      try {
        setDeleting(id);
        await createClientServices().inquiries.deleteByUserId(id);
        const { error } = await createClientServices().profiles.delete(id);

        if (error) throw new Error(error.message);
        toast.success("Patient deleted successfully");
        fetchPatients();
      } catch (error) {
        logger.error("PatientManager", "Error deleting patient", error);
        toast.error(
          "Failed to delete patient. They may have associated records that need to be removed first."
        );
      } finally {
        setDeleting(null);
      }
    },
    [fetchPatients]
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const filteredPatients = filterPatients(patients, searchQuery);
  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const paginatedPatients = paginatePatients(filteredPatients, currentPage, ITEMS_PER_PAGE);
  const stats = calculatePatientStats(patients);

  return {
    // State
    patients,
    loading,
    isDialogOpen,
    isViewDialogOpen,
    editingId,
    viewingPatient,
    saving,
    deleting,
    searchQuery,
    currentPage,
    formData,
    // Computed
    filteredPatients,
    paginatedPatients,
    totalPages,
    stats,
    // Actions
    setIsDialogOpen,
    setIsViewDialogOpen,
    setCurrentPage,
    setFormData,
    handleOpenDialog,
    handleViewPatient,
    handleSave,
    handleDelete,
    handleSearch,
  };
}
