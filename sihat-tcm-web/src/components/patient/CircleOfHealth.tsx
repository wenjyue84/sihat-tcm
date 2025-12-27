"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  MessageCircle,
  Heart,
  Camera,
  Send,
  Sparkles,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/stores/useAppStore";
import { useAuth } from "@/stores/useAppStore";

interface CircleOfHealthProps {
  userConstitution?: string;
}

export function CircleOfHealth({ userConstitution }: CircleOfHealthProps) {
  const { t } = useLanguage();
  const { profile } = useAuth();

  // Get user's constitution from profile or prop
  const constitution = userConstitution || profile?.constitution || "balanced";

  // Map constitution to circle name
  const getCircleName = (constitution: string): string => {
    const circleMap: Record<string, string> = {
      "damp-heat": "Damp-Heat Detox Group",
      "qi-deficiency": "Qi Vitality Circle",
      "yang-deficiency": "Yang Warming Tribe",
      "yin-deficiency": "Yin Nourishing Community",
      "dampness": "Dampness Clearing Squad",
      "blood-stasis": "Flow & Harmony Group",
      "qi-stagnation": "Emotional Balance Circle",
      "balanced": "Maintenance & Longevity",
      "special-care": "Special Care Group",
    };
    return circleMap[constitution] || "Health Support Circle";
  };

  const circleName = getCircleName(constitution);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Users className="h-6 w-6 text-emerald-600" />
                  {circleName}
                </CardTitle>
                <CardDescription className="text-slate-600 mt-2">
                  Connect with others who share your constitution and healing journey
                </CardDescription>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <Shield className="h-3 w-3 mr-1" />
                Anonymous
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-white">
                <Heart className="h-3 w-3 mr-1 text-emerald-600" />
                1,234 Members
              </Badge>
              <Badge variant="outline" className="bg-white">
                <MessageCircle className="h-3 w-3 mr-1 text-emerald-600" />
                567 Posts
              </Badge>
              <Badge variant="outline" className="bg-white">
                <Sparkles className="h-3 w-3 mr-1 text-emerald-600" />
                89 Success Stories
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Coming Soon Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Community Feature Coming Soon
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                We're building a supportive community where you can share your healing journey,
                exchange TCM-friendly meal ideas, and learn from others with similar constitutions.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>Anonymous Discussions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Camera className="h-4 w-4" />
                  <span>Meal Sharing</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>Success Stories</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <MessageCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800">Join Discussion</h4>
                <p className="text-sm text-slate-500">Share your experience</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Camera className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800">Share Meals</h4>
                <p className="text-sm text-slate-500">Post TCM-friendly recipes</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Heart className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800">Read Stories</h4>
                <p className="text-sm text-slate-500">Inspiration from others</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
