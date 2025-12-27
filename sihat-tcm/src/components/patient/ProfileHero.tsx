"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";

interface ProfileHeroProps {
  name: string;
  email?: string;
  avatar?: string;
}

export function ProfileHero({ name, email, avatar }: ProfileHeroProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center py-8 px-4"
    >
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mb-6 flex justify-center"
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-3xl font-light shadow-lg border-4 border-white">
            {initials || <User className="w-12 h-12" />}
          </div>
        )}
      </motion.div>

      {/* Name */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-5xl md:text-6xl font-light text-slate-900 tracking-tight mb-2"
      >
        {name || "Patient"}
      </motion.h1>

      {/* Welcome message */}
      {email && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-lg text-slate-600"
        >
          Welcome back
        </motion.p>
      )}
    </motion.div>
  );
}

