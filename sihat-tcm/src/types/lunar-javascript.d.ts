declare module "lunar-javascript" {
  export class Solar {
    static fromDate(date: Date): Solar;
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromJulianDay(jd: number): Solar;

    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getJieQiTable(): Record<string, string>;
    toYmd(): string;
  }

  export class Lunar {
    static fromDate(date: Date): Lunar;
    static fromYmd(year: number, month: number, day: number): Lunar;

    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getSolar(): Solar;
  }
}
