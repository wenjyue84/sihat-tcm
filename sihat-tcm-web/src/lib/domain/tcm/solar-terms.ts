/**
 * TCM Domain - Solar Terms Utilities
 *
 * Utility functions for calculating and working with solar terms.
 * Uses data from @/data/tcm/solar-terms-data
 */

import { Solar, Lunar } from "lunar-javascript";
import { SOLAR_TERMS_DATA, type SolarTermData, type Season } from "@/data/tcm/solar-terms-data";

export interface SolarTerm extends SolarTermData {
  date: Date;
}

// Re-export types
export type { Season, SolarTermData } from "@/data/tcm/solar-terms-data";

/**
 * Get current solar term based on current date
 */
export function getCurrentSolarTerm(): SolarTerm {
  const today = Solar.fromDate(new Date());
  const solarTerms = getSolarTermsForYear(today.getYear());

  const now = new Date().getTime();
  for (let i = solarTerms.length - 1; i >= 0; i--) {
    if (solarTerms[i].date.getTime() <= now) {
      return solarTerms[i];
    }
  }

  const previousYearTerms = getSolarTermsForYear(today.getYear() - 1);
  return previousYearTerms[previousYearTerms.length - 1];
}

/**
 * Get all 24 solar terms for a specific year
 */
export function getSolarTermsForYear(year: number): SolarTerm[] {
  const solarTerms: SolarTerm[] = [];

  const lunarStart = Lunar.fromDate(new Date(year, 0, 1));
  const lunarEnd = Lunar.fromDate(new Date(year, 11, 31));
  const table1 = (
    lunarStart as unknown as { getJieQiTable: () => Record<string, Solar> }
  ).getJieQiTable();
  const table2 = (
    lunarEnd as unknown as { getJieQiTable: () => Record<string, Solar> }
  ).getJieQiTable();

  const allEntries = [...Object.entries(table1), ...Object.entries(table2)];

  SOLAR_TERMS_DATA.forEach((termData, index) => {
    const matchedEntry = allEntries.find(([key, solarDate]) => {
      if (!key.includes(termData.nameZh)) return false;
      return solarDate.getYear() === year;
    });

    let termDate: Date;
    if (matchedEntry) {
      const solarObj = matchedEntry[1];
      termDate = new Date(solarObj.getYear(), solarObj.getMonth() - 1, solarObj.getDay());
    } else {
      const approximateDates = [
        [2, 4],
        [2, 19],
        [3, 6],
        [3, 21],
        [4, 5],
        [4, 20],
        [5, 6],
        [5, 21],
        [6, 6],
        [6, 21],
        [7, 7],
        [7, 23],
        [8, 8],
        [8, 23],
        [9, 8],
        [9, 23],
        [10, 8],
        [10, 23],
        [11, 7],
        [11, 22],
        [12, 7],
        [12, 22],
        [1, 6],
        [1, 20],
      ];
      const [month, day] = approximateDates[index];
      termDate = new Date(year, month - 1, day);
    }

    solarTerms.push({ ...termData, date: termDate });
  });

  return solarTerms.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get the next solar term after a given date
 */
export function getNextSolarTerm(fromDate: Date = new Date()): SolarTerm {
  const year = fromDate.getFullYear();
  const solarTerms = [...getSolarTermsForYear(year), ...getSolarTermsForYear(year + 1)];

  const now = fromDate.getTime();
  for (const term of solarTerms) {
    if (term.date.getTime() > now) {
      return term;
    }
  }

  return solarTerms[0];
}

/**
 * Get solar terms in a range (for timeline display)
 */
export function getSolarTermsInRange(startDate: Date, endDate: Date): SolarTerm[] {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  let allTerms: SolarTerm[] = [];
  for (let year = startYear; year <= endYear; year++) {
    allTerms = [...allTerms, ...getSolarTermsForYear(year)];
  }

  return allTerms.filter(
    (term) => term.date.getTime() >= startDate.getTime() && term.date.getTime() <= endDate.getTime()
  );
}

/**
 * Get color for a season
 */
export function getSeasonColor(season: Season): string {
  const colors = {
    spring: "#10b981",
    summer: "#ef4444",
    autumn: "#f59e0b",
    winter: "#3b82f6",
  };
  return colors[season];
}

/**
 * Get background gradient for a season
 */
export function getSeasonGradient(season: Season): string {
  const gradients = {
    spring: "from-emerald-500 to-green-600",
    summer: "from-red-500 to-orange-600",
    autumn: "from-amber-500 to-yellow-600",
    winter: "from-blue-500 to-cyan-600",
  };
  return gradients[season];
}

/**
 * Check if a solar term has passed
 */
export function hasSolarTermPassed(term: SolarTerm): boolean {
  return term.date.getTime() < new Date().getTime();
}

/**
 * Check if a solar term is current (within ±7 days)
 */
export function isCurrentSolarTerm(term: SolarTerm): boolean {
  const now = new Date().getTime();
  const termTime = term.date.getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return Math.abs(now - termTime) <= sevenDays;
}
