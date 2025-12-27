import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPin, MessageCircle, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TCMDoctor {
  id: string;
  name: string;
  photo: string;
  clinicName: string;
  specialties: string[];
  address: string;
  phone: string;
  experience: string;
  wazeLink?: string;
  workingHours?: string;
}

interface PractitionerListProps {
  doctors: TCMDoctor[];
  loading: boolean;
  variants: any;
}

export function PractitionerList({ doctors, loading, variants }: PractitionerListProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<TCMDoctor | null>(null);
  const { t } = useLanguage();

  return (
    <motion.div variants={variants} className="space-y-4">
      <div className="text-center">
        <h3 className="text-emerald-800 font-semibold mb-1">
          {t.report.recommendedPractitioners}
        </h3>
        <p className="text-stone-500 text-xs mb-4">{t.report.clickToViewDetails}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-full text-center py-4 text-stone-500">
            {t.common.loading}...
          </div>
        ) : doctors.length > 0 ? (
          doctors.map((doctor) => (
            <button
              key={doctor.id}
              onClick={() => setSelectedDoctor(doctor)}
              className="flex flex-col items-center p-3 bg-white rounded-xl border border-stone-200 hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-stone-100 rounded-full mb-2 overflow-hidden border border-stone-200 group-hover:border-emerald-200">
                <img
                  src={
                    doctor.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.name}`
                  }
                  alt={doctor.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-medium text-stone-700 group-hover:text-emerald-700 text-center line-clamp-1">
                {doctor.name}
              </span>
              <span className="text-[10px] text-stone-500 text-center line-clamp-1">
                {doctor.clinicName}
              </span>
            </button>
          ))
        ) : (
          <div className="col-span-full text-center py-4 text-stone-500 italic">
            {t.common.noMedicinesFound || "No practitioners found."}
          </div>
        )}
      </div>

      <Dialog open={!!selectedDoctor} onOpenChange={(open) => !open && setSelectedDoctor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.report.practitionerDetails}</DialogTitle>
          </DialogHeader>
          {selectedDoctor && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                  <img
                    src={selectedDoctor.photo}
                    alt={selectedDoctor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-stone-800">{selectedDoctor.name}</h4>
                  <p className="text-emerald-600 font-medium text-sm">
                    {selectedDoctor.clinicName}
                  </p>
                  <p className="text-stone-500 text-xs">{selectedDoctor.experience} {t.report.experience}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h5 className="text-xs font-semibold text-stone-500 uppercase mb-1">
                    {t.report.acupuncture || "Specialties"}
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {selectedDoctor.specialties.map((spec, idx) => (
                      <span
                        key={idx}
                        className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs border border-emerald-100"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm text-stone-600">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-stone-400" />
                  <span>{selectedDoctor.address}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <MessageCircle className="w-4 h-4 shrink-0 text-stone-400" />
                  <span>{selectedDoctor.phone}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Clock className="w-4 h-4 shrink-0 text-stone-400" />
                  <span>{selectedDoctor.workingHours}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-start">
            <button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-md py-2 text-sm font-medium transition-colors"
              onClick={() => {
                alert(`Simulating call to ${selectedDoctor?.name}...`);
              }}
            >
              {t.report.bookAppointment}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
