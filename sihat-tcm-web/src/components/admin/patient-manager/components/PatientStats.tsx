"use client";

interface PatientStatsProps {
  stats: {
    total: number;
    male: number;
    female: number;
    avgAge: number;
  };
}

export function PatientStats({ stats }: PatientStatsProps) {
  return (
    <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-emerald-600">{stats.total}</div>
        <div className="text-xs text-muted-foreground">Total Patients</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.male}</div>
        <div className="text-xs text-muted-foreground">Male</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-pink-600">{stats.female}</div>
        <div className="text-xs text-muted-foreground">Female</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-amber-600">{stats.avgAge}</div>
        <div className="text-xs text-muted-foreground">Avg Age</div>
      </div>
    </div>
  );
}
