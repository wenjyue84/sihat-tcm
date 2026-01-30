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
import { Loader2, Pencil, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { UserProfile, RoleFilter } from "../types";
import { ROLE_CONFIG } from "../constants";
import { calculateBMI } from "../utils";

interface UserTableProps {
  users: UserProfile[];
  loading: boolean;
  deleting: string | null;
  searchQuery: string;
  roleFilter: RoleFilter;
  currentPage: number;
  totalPages: number;
  totalFiltered: number;
  itemsPerPage: number;
  onView: (user: UserProfile) => void;
  onEdit: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
  onPageChange: (page: number) => void;
}

export function UserTable({
  users,
  loading,
  deleting,
  searchQuery,
  roleFilter,
  currentPage,
  totalPages,
  totalFiltered,
  itemsPerPage,
  onView,
  onEdit,
  onDelete,
  onPageChange,
}: UserTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Age</TableHead>
              <TableHead className="hidden md:table-cell">Gender</TableHead>
              <TableHead className="hidden md:table-cell">BMI</TableHead>
              <TableHead className="hidden lg:table-cell">Joined</TableHead>
              <TableHead className="hidden xl:table-cell">Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchQuery || roleFilter !== "all"
                    ? "No users match your search criteria."
                    : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  deleting={deleting}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalFiltered)} of {totalFiltered} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

interface UserRowProps {
  user: UserProfile;
  deleting: string | null;
  onView: (user: UserProfile) => void;
  onEdit: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
}

function UserRow({ user, deleting, onView, onEdit, onDelete }: UserRowProps) {
  const roleConfig = ROLE_CONFIG[user.role];
  const RoleIcon = roleConfig.icon;

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${roleConfig.bgColor}`}
          >
            <RoleIcon className={`w-4 h-4 ${roleConfig.color.split(" ")[1]}`} />
          </div>
          <div>
            <div>{user.full_name || "Unnamed User"}</div>
            <div className="text-xs text-muted-foreground truncate max-w-[150px]">
              {user.email || "No email"}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={roleConfig.color}>
          {roleConfig.label}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {user.role === "patient" ? (
          <span className="text-sm text-muted-foreground">
            {user.age ? `${user.age} yrs` : "-"}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {user.role === "patient" ? (
          <span className="text-sm text-muted-foreground capitalize">{user.gender || "-"}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {user.role === "patient" ? (
          (() => {
            const bmi = user.bmi || calculateBMI(user.height, user.weight);
            return bmi ? (
              <span className="text-sm font-medium text-stone-700">{bmi.toFixed(1)}</span>
            ) : (
              <span className="text-muted-foreground">-</span>
            );
          })()
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
      </TableCell>
      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
        {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : "-"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => onView(user)} title="View Details">
            <Eye className="w-4 h-4" />
          </Button>
          {user.role === "patient" && (
            <>
              <Button variant="ghost" size="icon" onClick={() => onEdit(user)} title="Edit Patient">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(user)}
                disabled={deleting === user.id}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete Patient"
              >
                {deleting === user.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
