"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Pencil, Trash2, User, Loader2 } from "lucide-react";
import { calculateBMI, getBMICategory } from "../utils";
import type { Patient } from "../types";

interface PatientTableProps {
  patients: Patient[];
  searchQuery: string;
  deleting: string | null;
  onView: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
}

export function PatientTable({
  patients,
  searchQuery,
  deleting,
  onView,
  onEdit,
  onDelete,
}: PatientTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead className="hidden md:table-cell">Age / Gender</TableHead>
            <TableHead className="hidden lg:table-cell">BMI</TableHead>
            <TableHead className="hidden lg:table-cell">Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No patients match your search." : "No patients found."}
              </TableCell>
            </TableRow>
          ) : (
            patients.map((patient) => {
              const bmi = calculateBMI(patient.height, patient.weight);
              const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;
              return (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div>{patient.full_name || "Unnamed Patient"}</div>
                        <div className="text-xs text-muted-foreground md:hidden">
                          {patient.age && `${patient.age} yrs`}
                          {patient.age && patient.gender && " • "}
                          {patient.gender}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm">
                      {patient.age ? `${patient.age} years` : "-"}
                      <span className="text-muted-foreground mx-1">/</span>
                      {patient.gender || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {bmi ? (
                      <Badge variant="outline" className={bmiCategory?.color}>
                        {bmi} ({bmiCategory?.label})
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {patient.updated_at ? new Date(patient.updated_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(patient)}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(patient)}
                        title="Edit Patient"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(patient.id)}
                        disabled={deleting === patient.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete Patient"
                      >
                        {deleting === patient.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
