"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets,
  Leaf,
  Flame,
  Sparkles,
  Trophy,
  Clock,
  Gift,
  Store,
  Backpack,
  AlertCircle,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/stores/useAppStore";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Herb {
  id: string;
  name: string;
  growth: number;
  level: number;
  type: "ginseng" | "reishi" | "goji";
  status: "healthy" | "thirsty" | "withering";
}

export function QiGarden() {
  const { t } = useLanguage();
  const tg = t.qiGarden;

  // State for garden data
  const [essence, setEssence] = useState(120);
  const [water, setWater] = useState(5);
  const [herb, setHerb] = useState<Herb>({
    id: "1",
    name: tg.herbGinseng,
    growth: 65,
    level: 3,
    type: "ginseng",
    status: "healthy",
  });

  const [showEarnedEffect, setShowEarnedEffect] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Growth stage calculation
  const getGrowthStage = (growth: number) => {
    if (growth < 20) return "Seedling";
    if (growth < 50) return "Sprout";
    if (growth < 80) return "Growing";
    return "Mature";
  };

  const handleWater = () => {
    if (water > 0) {
      setWater((prev) => prev - 1);
      setHerb((prev) => ({
        ...prev,
        growth: Math.min(100, prev.growth + 5),
        status: "healthy",
      }));
      setLastAction("water");
      setTimeout(() => setLastAction(null), 2000);
    }
  };

  const handleNurture = () => {
    if (essence >= 20) {
      setEssence((prev) => prev - 20);
      setHerb((prev) => ({
        ...prev,
        growth: Math.min(100, prev.growth + 10),
      }));
      setLastAction("nurture");
      setTimeout(() => setLastAction(null), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                {tg.essence}
              </p>
              <p className="text-lg font-semibold text-slate-900">{essence}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                {tg.water}
              </p>
              <p className="text-lg font-semibold text-slate-900">{water}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm hidden lg:block">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                {tg.level}
              </p>
              <p className="text-lg font-semibold text-slate-900">{herb.level}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm hidden lg:block">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Gift className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Rewards
              </p>
              <p className="text-lg font-semibold text-slate-900">2 Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Garden View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="relative h-[450px] overflow-hidden border border-slate-200 shadow-sm rounded-3xl group bg-white">
            {/* Garden Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/50" />

            {/* Animated Mist */}
            <motion.div
              animate={{ x: [-10, 10, -10], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-white/20 blur-3xl pointer-events-none"
            />

            {/* Garden Floor */}
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-emerald-800/20 to-transparent" />

            {/* The Herb Container */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Floating Island Base (Pure CSS) */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <div className="w-64 h-16 bg-slate-800/10 rounded-[100%] blur-xl absolute -bottom-8 left-1/2 -translate-x-1/2" />

                  {/* Virtual Herb Representation */}
                  <div className="relative w-48 h-64 flex items-end justify-center pb-8">
                    {/* Glow Effect */}
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute w-40 h-40 bg-emerald-400 rounded-full blur-[80px] -bottom-10"
                    />

                    {/* CSS-based Ginseng Representation */}
                    <div className="relative z-20 flex flex-col items-center">
                      {/* Leaves */}
                      <div className="flex gap-2 -mb-2">
                        <motion.div
                          animate={{ rotate: [-2, 2, -2] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="w-12 h-16 bg-emerald-500 rounded-full rounded-tr-none rotate-45 transform-gpu shadow-lg border border-emerald-400/30"
                        />
                        <motion.div
                          animate={{ rotate: [2, -2, 2] }}
                          transition={{ duration: 3.5, repeat: Infinity }}
                          className="w-14 h-20 bg-emerald-600 rounded-full rounded-tl-none -rotate-45 transform-gpu shadow-lg border border-emerald-500/30"
                        />
                      </div>
                      {/* Stem */}
                      <div className="w-3 h-16 bg-emerald-800/80 rounded-full shadow-inner" />
                      {/* Root (Simplified) */}
                      <div className="w-16 h-24 bg-amber-100/90 rounded-2xl rounded-t-full border-2 border-amber-200/50 shadow-xl flex items-center justify-center backdrop-blur-sm">
                        <Leaf className="w-8 h-8 text-amber-500/30" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Action Feedback Animations */}
                <AnimatePresence>
                  {lastAction === "water" && (
                    <motion.div
                      initial={{ y: -40, opacity: 0 }}
                      animate={{ y: 20, opacity: 1 }}
                      exit={{ y: 40, opacity: 0 }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 z-30"
                    >
                      <Droplets className="w-12 h-12 text-blue-400 fill-blue-500/20" />
                    </motion.div>
                  )}
                  {lastAction === "nurture" && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 2, opacity: 1 }}
                      exit={{ scale: 3, opacity: 0 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
                    >
                      <Sparkles className="w-12 h-12 text-amber-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Top Left Info Overlay */}
            <div className="absolute top-6 left-6 p-4 bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-md z-20 max-w-[180px]">
              <h4 className="font-semibold text-slate-900 leading-tight mb-2">{herb.name}</h4>
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-700 text-xs border-none"
                >
                  LVL {herb.level}
                </Badge>
                <span className="text-xs font-medium text-slate-500">
                  {getGrowthStage(herb.growth)}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>{tg.growth}</span>
                  <span>{herb.growth}%</span>
                </div>
                <Progress
                  value={herb.growth}
                  className="h-1.5 bg-slate-100"
                  indicatorClassName="bg-slate-700"
                />
              </div>
            </div>

            {/* Status Alert */}
            {herb.status === "withering" && (
              <div className="absolute top-6 right-6 z-20">
                <div className="px-3 py-2 bg-white border border-red-200 rounded-xl text-xs font-medium flex items-center gap-2 shadow-md">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-700">{tg.witherWarning}</span>
                </div>
              </div>
            )}

            {/* Bottom Actions Overlay */}
            <div className="absolute bottom-6 inset-x-6 flex items-center justify-center gap-3 z-20">
              <Button
                onClick={handleWater}
                disabled={water === 0}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 h-11 rounded-xl shadow-sm flex items-center gap-2 transition-all font-medium"
              >
                <Droplets className="w-4 h-4" />
                {tg.waterPlant}
              </Button>
              <Button
                onClick={handleNurture}
                disabled={essence < 20}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 h-11 rounded-xl shadow-sm flex items-center gap-2 transition-all font-medium"
              >
                <Flame className="w-4 h-4" />
                {tg.nurture}
              </Button>
              <Button
                variant="outline"
                className="bg-white/90 backdrop-blur-md h-11 w-11 rounded-xl border border-slate-200 shadow-sm hover:bg-white"
                onClick={() =>
                  setHerb((prev) => ({
                    ...prev,
                    status: prev.status === "healthy" ? "withering" : "healthy",
                  }))
                }
              >
                <Info className="w-4 h-4 text-slate-600" />
              </Button>
            </div>
          </Card>

          {/* How to Earn Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              Get More Essence
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: tg.habits.logMeal,
                  icon: Backpack,
                  reward: "+15 Essence",
                },
                {
                  title: tg.habits.doExercise,
                  icon: Clock,
                  reward: "+25 Essence",
                },
                {
                  title: tg.habits.checkIn,
                  icon: CheckCircle2,
                  reward: "+10 Essence",
                },
              ].map((habit, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -2 }}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-2 group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <habit.icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <h5 className="font-semibold text-slate-900 text-sm">{habit.title}</h5>
                  <span className="text-xs font-medium text-slate-500">
                    {habit.reward}
                  </span>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar: Shop & Inventory */}
        <div className="space-y-6">
          {/* Herb Shop */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-900">
                <Store className="w-5 h-5 text-slate-600" />
                {tg.shop}
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Trade essence for rare seeds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 group cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{tg.herbReishi}</p>
                    <p className="text-xs text-slate-500">Rare • High Vitality</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">200</p>
                  <p className="text-xs text-slate-500 uppercase font-medium">ESSENCE</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-600">{tg.herbGoji}</p>
                    <p className="text-xs text-slate-400">Epic • Anti-Oxidant</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-400">500</p>
                  <p className="text-xs text-slate-400 uppercase font-medium">LOCKED</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unlocked Coupons */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-900">
                <Gift className="w-5 h-5 text-slate-600" />
                Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <Badge className="bg-slate-900 text-white mb-3 text-xs">{tg.couponUnlocked}</Badge>
                <h5 className="font-semibold text-slate-900 text-lg mb-1">10% OFF</h5>
                <p className="text-sm text-slate-600 mb-4">
                  Harvest your digital Ginseng for a real discount
                </p>
                <Button className="w-full bg-slate-900 text-white font-medium rounded-xl h-10 text-sm hover:bg-slate-800">
                  {tg.redeemCoupon}
                </Button>
              </div>

              <p className="text-xs text-center text-slate-500 font-medium mt-2">
                Harvest progress: {herb.growth}/100
              </p>
            </CardContent>
          </Card>

          {/* Inventory Brief */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <Backpack className="w-4 h-4" />
                  {tg.inventory}
                </h4>
                <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                  8 Slots Used
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center"
                  >
                    <div className="w-6 h-6 bg-slate-200 rounded-sm" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                  +
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
