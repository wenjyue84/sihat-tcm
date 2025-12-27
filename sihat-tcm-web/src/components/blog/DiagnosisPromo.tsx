"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function DiagnosisPromo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-8 not-prose"
    >
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100 p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full blur-2xl -mr-10 -mt-10" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-emerald-600 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="flex-grow">
            <h4 className="font-serif font-bold text-lg text-emerald-900 mb-1">
              Curious about your health?
            </h4>
            <p className="text-sm text-emerald-700 max-w-md">
              Get a personalized TCM diagnosis in seconds using our advanced AI tongue analysis.
            </p>
          </div>

          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all shrink-0"
          >
            <Link href="/">
              Start Diagnosis <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
