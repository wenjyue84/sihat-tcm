"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, User } from "lucide-react";
import { usePatientManager } from "./hooks";
import {
  PatientTable,
  PatientSearchBar,
  PaginationControls,
  PatientStats,
  EditPatientDialog,
  ViewPatientDialog,
} from "./components";

export function PatientManager() {
  const {
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
    filteredPatients,
    paginatedPatients,
    totalPages,
    stats,
    setIsDialogOpen,
    setIsViewDialogOpen,
    setCurrentPage,
    setFormData,
    handleOpenDialog,
    handleViewPatient,
    handleSave,
    handleDelete,
    handleSearch,
  } = usePatientManager();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Patient Management
          </CardTitle>
          <CardDescription>View and manage all registered patients</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <PatientSearchBar value={searchQuery} onChange={handleSearch} />

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            <PatientTable
              patients={paginatedPatients}
              searchQuery={searchQuery}
              deleting={deleting}
              onView={handleViewPatient}
              onEdit={handleOpenDialog}
              onDelete={handleDelete}
            />

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredPatients.length}
              onPageChange={setCurrentPage}
            />

            <PatientStats stats={stats} />
          </>
        )}
      </CardContent>

      <EditPatientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleSave}
        saving={saving}
        isEditing={!!editingId}
      />

      <ViewPatientDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        patient={viewingPatient}
        onEdit={handleOpenDialog}
      />
    </Card>
  );
}
