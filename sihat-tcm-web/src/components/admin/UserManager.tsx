"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Pencil,
  Trash2,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Users,
  UserCog,
  Shield,
  Stethoscope,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/lib/clientLogger";

export interface UserProfile {
  id: string;
  email?: string;
  role: "patient" | "doctor" | "admin" | "developer";
  full_name?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  medical_history?: string;
  updated_at?: string;
  created_at?: string;
}

type RoleFilter = "all" | "patient" | "doctor" | "admin" | "developer";

const ITEMS_PER_PAGE = 10;

const ROLE_CONFIG = {
  patient: {
    label: "Patient",
    icon: User,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    bgColor: "bg-emerald-50",
  },
  doctor: {
    label: "Doctor",
    icon: Stethoscope,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    bgColor: "bg-blue-50",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-amber-100 text-amber-700 border-amber-200",
    bgColor: "bg-amber-50",
  },
  developer: {
    label: "Developer",
    icon: UserCog,
    color: "bg-violet-100 text-violet-700 border-violet-200",
    bgColor: "bg-violet-50",
  },
};

export function UserManager() {
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
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
  };

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
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
  };

  const calculateBMI = (height?: number, weight?: number) => {
    if (!height || !weight) return null;
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi;
  };

  const handleSave = async () => {
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

      const { error } = await supabase
        .from("profiles")
        .update(dataToSave)
        .eq("id", selectedUser.id);

      if (error) throw error;
      toast.success("Patient updated successfully");
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      logger.error("UserManager", "Error saving patient", error);
      toast.error("Failed to save patient");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: UserProfile) => {
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
      await supabase.from("inquiries").delete().eq("user_id", user.id);

      // Then delete the profile
      const { error } = await supabase.from("profiles").delete().eq("id", user.id);

      if (error) throw error;
      toast.success("Patient deleted successfully");
      fetchUsers();
    } catch (error) {
      logger.error("UserManager", "Error deleting patient", error);
      toast.error("Failed to delete patient. They may have associated records.");
    } finally {
      setDeleting(null);
    }
  };

  // Filter users based on search query and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Paginate filtered results
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Stats
  const stats = {
    total: users.length,
    patients: users.filter((u) => u.role === "patient").length,
    doctors: users.filter((u) => u.role === "doctor").length,
    admins: users.filter((u) => u.role === "admin").length,
    developers: users.filter((u) => u.role === "developer").length,
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "bg-blue-100 text-blue-700" };
    if (bmi < 25) return { label: "Normal", color: "bg-green-100 text-green-700" };
    if (bmi < 30) return { label: "Overweight", color: "bg-yellow-100 text-yellow-700" };
    return { label: "Obese", color: "bg-red-100 text-red-700" };
  };

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            className={`p-4 rounded-lg border cursor-pointer transition-all ${roleFilter === "all" ? "ring-2 ring-stone-400" : "hover:bg-stone-50"}`}
            onClick={() => {
              setRoleFilter("all");
              setCurrentPage(1);
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <UserCog className="w-4 h-4 text-stone-600" />
              <span className="text-sm text-muted-foreground">All Users</span>
            </div>
            <div className="text-2xl font-bold text-stone-700">{stats.total}</div>
          </div>
          <div
            className={`p-4 rounded-lg border cursor-pointer transition-all ${roleFilter === "patient" ? "ring-2 ring-emerald-400" : "hover:bg-emerald-50"}`}
            onClick={() => {
              setRoleFilter("patient");
              setCurrentPage(1);
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-muted-foreground">Patients</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{stats.patients}</div>
          </div>
          <div
            className={`p-4 rounded-lg border cursor-pointer transition-all ${roleFilter === "doctor" ? "ring-2 ring-blue-400" : "hover:bg-blue-50"}`}
            onClick={() => {
              setRoleFilter("doctor");
              setCurrentPage(1);
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Doctors</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.doctors}</div>
          </div>
          <div
            className={`p-4 rounded-lg border cursor-pointer transition-all ${roleFilter === "admin" ? "ring-2 ring-amber-400" : "hover:bg-amber-50"}`}
            onClick={() => {
              setRoleFilter("admin");
              setCurrentPage(1);
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">Admins</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">{stats.admins}</div>
          </div>
          <div
            className={`p-4 rounded-lg border cursor-pointer transition-all ${roleFilter === "developer" ? "ring-2 ring-violet-400" : "hover:bg-violet-50"}`}
            onClick={() => {
              setRoleFilter("developer");
              setCurrentPage(1);
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="w-4 h-4 text-violet-600" />
              <span className="text-sm text-muted-foreground">Developers</span>
            </div>
            <div className="text-2xl font-bold text-violet-600">{stats.developers}</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
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
                  {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {searchQuery || roleFilter !== "all"
                          ? "No users match your search criteria."
                          : "No users found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user) => {
                      const roleConfig = ROLE_CONFIG[user.role];
                      const RoleIcon = roleConfig.icon;
                      return (
                        <TableRow key={user.id}>
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
                              <span className="text-sm text-muted-foreground capitalize">
                                {user.gender || "-"}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {user.role === "patient" ? (
                              (() => {
                                const bmi = user.bmi || calculateBMI(user.height, user.weight);
                                return bmi ? (
                                  <span className="text-sm font-medium text-stone-700">
                                    {bmi.toFixed(1)}
                                  </span>
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewUser(user)}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {user.role === "patient" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditUser(user)}
                                    title="Edit Patient"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(user)}
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
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of{" "}
                  {filteredUsers.length} users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedUser && (
                <>
                  {(() => {
                    const Icon = ROLE_CONFIG[selectedUser.role].icon;
                    return <Icon className="w-5 h-5" />;
                  })()}
                  User Details
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-4">
              <div
                className={`flex items-center gap-4 p-4 rounded-lg ${ROLE_CONFIG[selectedUser.role].bgColor}`}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${ROLE_CONFIG[selectedUser.role].color.split(" ").slice(0, 2).join(" ")}`}
                >
                  {(() => {
                    const Icon = ROLE_CONFIG[selectedUser.role].icon;
                    return <Icon className="w-8 h-8" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedUser.full_name || "Unnamed User"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email || "No email"}
                  </p>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${ROLE_CONFIG[selectedUser.role].color}`}
                  >
                    {ROLE_CONFIG[selectedUser.role].label}
                  </Badge>
                </div>
              </div>

              {selectedUser.role === "patient" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Age</div>
                      <div className="font-semibold">
                        {selectedUser.age ? `${selectedUser.age} years` : "-"}
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Gender</div>
                      <div className="font-semibold">{selectedUser.gender || "-"}</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Height</div>
                      <div className="font-semibold">
                        {selectedUser.height ? `${selectedUser.height} cm` : "-"}
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Weight</div>
                      <div className="font-semibold">
                        {selectedUser.weight ? `${selectedUser.weight} kg` : "-"}
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg col-span-2">
                      <div className="text-sm text-muted-foreground">BMI</div>
                      {(() => {
                        const bmi = calculateBMI(selectedUser.height, selectedUser.weight);
                        const category = bmi ? getBMICategory(bmi) : null;
                        return bmi ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{bmi.toFixed(1)}</span>
                            <Badge variant="outline" className={category?.color}>
                              {category?.label}
                            </Badge>
                          </div>
                        ) : (
                          <div className="font-semibold">-</div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Medical History</div>
                    <div className="text-sm">
                      {selectedUser.medical_history || "No medical history recorded."}
                    </div>
                  </div>
                </>
              )}

              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Last updated:{" "}
                {selectedUser.updated_at
                  ? new Date(selectedUser.updated_at).toLocaleString()
                  : "Unknown"}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedUser?.role === "patient" && (
              <Button
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEditUser(selectedUser);
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Patient
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Only for Patients */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.full_name || ""}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. John Smith"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, age: parseInt(e.target.value) || undefined })
                  }
                  placeholder="e.g. 35"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender || ""}
                  onValueChange={(v) => setFormData({ ...formData, gender: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, height: parseFloat(e.target.value) || undefined })
                  }
                  placeholder="e.g. 175"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: parseFloat(e.target.value) || undefined })
                  }
                  placeholder="e.g. 70"
                />
              </div>
            </div>

            {/* BMI Preview */}
            {formData.height && formData.weight && (
              <div className="p-3 bg-stone-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Calculated BMI</div>
                <div className="flex items-center gap-2 mt-1">
                  {(() => {
                    const bmi = calculateBMI(formData.height, formData.weight);
                    const category = bmi ? getBMICategory(bmi) : null;
                    return bmi ? (
                      <>
                        <span className="text-lg font-semibold">{bmi.toFixed(1)}</span>
                        <Badge variant="outline" className={category?.color}>
                          {category?.label}
                        </Badge>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="medical_history">Medical History</Label>
              <Textarea
                id="medical_history"
                value={formData.medical_history || ""}
                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                placeholder="Previous conditions, allergies, chronic diseases, etc."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
