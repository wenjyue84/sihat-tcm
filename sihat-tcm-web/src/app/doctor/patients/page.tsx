"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  User,
  Mail,
  Users,
  AlertCircle,
  UserPlus,
  ShieldCheck,
  Stethoscope,
  Phone,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Patient, PatientFlag, PatientType } from "@/types/database";
import { format, differenceInYears } from "date-fns";
import { toast } from "sonner";
import { FlagBadge } from "@/components/ui/FlagBadge";
import { PatientFlagUpdate } from "@/components/doctor/PatientFlagUpdate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { AddPatientDialog } from "@/components/doctor/AddPatientDialog";

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [flagFilter, setFlagFilter] = useState<PatientFlag | "All">("All");
  const [activeTab, setActiveTab] = useState("all");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<PatientType[]>([
    "managed",
    "registered",
    "guest",
  ]);
  const supabase = createClient();

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // For demo purposes, if we have no patients, we show 7 unique mock patients
      // Or if we have some, we ensure we have a variety for testing filters
      let displayPatients = data || [];
      if (displayPatients.length === 0) {
        displayPatients = [
          {
            id: "p1",
            first_name: "Wei",
            last_name: "Tan",
            type: "managed",
            status: "active",
            gender: "male",
            birth_date: "1980-05-15",
            phone: "+60123456789",
            ic_no: "800515-14-5566",
            flag: "Critical",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Patient,
          {
            id: "p2",
            first_name: "Siti",
            last_name: "Aminah",
            type: "registered",
            status: "active",
            gender: "female",
            birth_date: "1992-08-22",
            phone: "+60178882234",
            ic_no: "920822-10-1122",
            flag: "Normal",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Patient,
          {
            id: "p3",
            first_name: "Ravi",
            last_name: "Kumar",
            type: "guest",
            status: "active",
            gender: "male",
            birth_date: "1975-12-01",
            phone: "+60193334455",
            ic_no: "751201-08-9988",
            flag: "Watch",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Patient,
          {
            id: "p4",
            first_name: "Mei",
            last_name: "Lim",
            type: "managed",
            status: "active",
            gender: "female",
            birth_date: "1988-03-30",
            phone: "+60112233445",
            ic_no: "880330-14-3344",
            flag: "High Priority",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Patient,
          {
            id: "p5",
            first_name: "Ahmad",
            last_name: "Razak",
            type: "registered",
            status: "active",
            gender: "male",
            birth_date: "1985-11-12",
            phone: "+60127776655",
            ic_no: "851112-01-5544",
            flag: "Normal",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Patient,
          {
            id: "p6",
            first_name: "Priya",
            last_name: "Devi",
            type: "guest",
            status: "active",
            gender: "female",
            birth_date: "1995-07-18",
            phone: "+60165554433",
            ic_no: "950718-10-8877",
            flag: "Normal",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Patient,
          {
            id: "p7",
            first_name: "Jun",
            last_name: "Wong",
            type: "managed",
            status: "active",
            gender: "male",
            birth_date: "1960-01-25",
            phone: "+60124445566",
            ic_no: "600125-14-7788",
            flag: "Critical",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Patient,
        ];
      }
      setPatients(displayPatients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const updatePatientFlag = async (patientId: string, flag: PatientFlag) => {
    // If it's mock data (p1, p2, etc), just update local state
    if (patientId.startsWith("p") || patientId.startsWith("mock")) {
      setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, flag } : p)));
      toast.success(`Flag updated to ${flag || "Normal"} (Demo Mode)`);
      return;
    }

    try {
      const { error } = await supabase.from("patients").update({ flag }).eq("id", patientId);

      if (error) throw error;

      setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, flag } : p)));
      toast.success(`Flag updated to ${flag || "Normal"}`);
    } catch (error: any) {
      console.error("Error updating flag:", error.message || error);
      toast.error(`Failed to update flag: ${error.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const stats = useMemo(() => {
    return {
      total: patients.length,
      critical: patients.filter((p) => p.flag === "Critical").length,
      managed: patients.filter((p) => p.type === "managed").length,
      registered: patients.filter((p) => p.type === "registered").length,
      guest: patients.filter((p) => p.type === "guest").length,
    };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.last_name && patient.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.phone && patient.phone.includes(searchTerm)) ||
        (patient.ic_no && patient.ic_no.includes(searchTerm));

      const matchesFlag = flagFilter === "All" || patient.flag === flagFilter;

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "managed" && patient.type === "managed") ||
        (activeTab === "registered" && patient.type === "registered") ||
        (activeTab === "guest" && patient.type === "guest") ||
        (activeTab === "critical" && patient.flag === "Critical");

      const matchesTypeFilter = selectedTypes.includes(patient.type);

      return matchesSearch && matchesFlag && matchesTab && matchesTypeFilter;
    });
  }, [patients, searchTerm, flagFilter, activeTab, selectedTypes]);

  const handleInvite = (id: string) => {
    toast.info("Invite feature coming soon");
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header Area */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Patients Management
              </h1>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {stats.total} total patients in your care
              </p>
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 border-slate-200 text-slate-600">
                    <Filter className="w-4 h-4" />
                    Filter Types ({selectedTypes.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Account Types</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      const type = "managed" as PatientType;
                      setSelectedTypes((prev) =>
                        prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                      );
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className={`w-4 h-4 border rounded flex items-center justify-center ${selectedTypes.includes("managed") ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"}`}
                      >
                        {selectedTypes.includes("managed") && <ShieldCheck className="w-3 h-3" />}
                      </div>
                      <span>Doctor-managed</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      const type = "registered" as PatientType;
                      setSelectedTypes((prev) =>
                        prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                      );
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className={`w-4 h-4 border rounded flex items-center justify-center ${selectedTypes.includes("registered") ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"}`}
                      >
                        {selectedTypes.includes("registered") && (
                          <ShieldCheck className="w-3 h-3" />
                        )}
                      </div>
                      <span>Self-registered</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      const type = "guest" as PatientType;
                      setSelectedTypes((prev) =>
                        prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                      );
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className={`w-4 h-4 border rounded flex items-center justify-center ${selectedTypes.includes("guest") ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"}`}
                      >
                        {selectedTypes.includes("guest") && <ShieldCheck className="w-3 h-3" />}
                      </div>
                      <span>Guest</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSelectedTypes(["managed", "registered", "guest"])}
                    className="text-center justify-center text-blue-600"
                  >
                    Reset Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95"
                onClick={() => setIsAddModalOpen(true)}
              >
                <UserPlus className="w-4 h-4" />
                Add Patient
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <Card className="border-none shadow-sm bg-blue-50/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Patients</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stats.total}</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-red-50/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Critical Cases</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stats.critical}</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-indigo-50/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Registered</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stats.registered}</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-slate-50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Managed</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stats.managed}</h3>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-[#f8fafc]">
        <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Tabs defaultValue="all" className="w-[400px]" onValueChange={setActiveTab}>
              <TabsList className="bg-white border border-slate-200">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="managed"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
                >
                  Managed
                </TabsTrigger>
                <TabsTrigger
                  value="registered"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
                >
                  Registered
                </TabsTrigger>
                <TabsTrigger
                  value="guest"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
                >
                  Guest
                </TabsTrigger>
                <TabsTrigger
                  value="critical"
                  className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
                >
                  Critical
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, phone, or IC..."
                className="pl-9 bg-white border-slate-200 shadow-sm focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Patient List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-24 text-center">
                <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                <p className="text-slate-500 font-medium">Retrieving patient records...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Patient Details
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Clinical Status
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Account Type
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Last Visit
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPatients.map((patient) => {
                      const age = patient.birth_date
                        ? differenceInYears(new Date(), new Date(patient.birth_date))
                        : null;

                      return (
                        <tr key={patient.id} className="hover:bg-slate-50/80 transition-all group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner group-hover:scale-105 transition-transform">
                                {patient.first_name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-base leading-tight">
                                  {patient.first_name} {patient.last_name}
                                </div>
                                <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                  <span className="capitalize">{patient.gender || "Unknown"}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                  <span>{age ? `${age} yrs` : "Age N/A"}</span>
                                </div>
                                {patient.phone && (
                                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {patient.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2">
                              <PatientFlagUpdate
                                currentFlag={patient.flag || "Normal"}
                                onUpdate={(flag) => updatePatientFlag(patient.id, flag)}
                              />
                              <Badge
                                variant="outline"
                                className="w-fit text-[10px] uppercase border-slate-200 text-slate-500"
                              >
                                {patient.status}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                patient.type === "registered"
                                  ? "default"
                                  : patient.type === "managed"
                                    ? "secondary"
                                    : "outline"
                              }
                              className={
                                patient.type === "registered"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                                  : patient.type === "managed"
                                    ? "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                    : "bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100"
                              }
                            >
                              {patient.type === "registered"
                                ? "Self-registered"
                                : patient.type === "managed"
                                  ? "Doctor-managed"
                                  : "Guest"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-600 text-sm font-medium">
                              {format(new Date(patient.updated_at), "MMM d, yyyy")}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase mt-0.5">
                              {format(new Date(patient.updated_at), "HH:mm")}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-9 px-4 border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Link href={`/doctor/diagnose?step=patient-info&patientId=${patient.id}`}>
                                  <Stethoscope className="w-4 h-4 mr-2" />
                                  Diagnose
                                </Link>
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-slate-400 hover:text-slate-600"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/doctor/patients/${patient.id}`}
                                      className="cursor-pointer"
                                    >
                                      <User className="w-4 h-4 mr-2" />
                                      View Record
                                    </Link>
                                  </DropdownMenuItem>
                                  {patient.type === "managed" && (
                                    <DropdownMenuItem
                                      onClick={() => handleInvite(patient.id)}
                                      className="text-blue-600 focus:text-blue-700 cursor-pointer"
                                    >
                                      <Mail className="w-4 h-4 mr-2" />
                                      Invite to App
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-slate-600 cursor-pointer">
                                    Edit Basic Info
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600 focus:text-red-700 cursor-pointer">
                                    Archive Patient
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredPatients.length === 0 && (
              <div className="p-24 text-center bg-slate-50/30">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No patients found</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <Button className="gap-2 bg-blue-600" onClick={() => setIsAddModalOpen(true)}>
                  <UserPlus className="w-4 h-4" />
                  Add New Patient
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddPatientDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={fetchPatients}
      />
    </div>
  );
}
