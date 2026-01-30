"use client";

interface SignupBenefitsProps {
  translations: {
    title: string;
    saveProfile: string;
    saveReports: string;
    trackProgress: string;
  };
}

export function SignupBenefits({ translations }: SignupBenefitsProps) {
  return (
    <div className="hidden md:flex w-1/2 bg-gradient-to-br from-emerald-800 to-teal-900 p-8 text-white flex-col justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="relative z-10">
        <h3 className="text-2xl font-bold mb-6">{translations.title}</h3>
        <ul className="space-y-6">
          <li className="flex items-start gap-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <svg
                className="w-6 h-6 text-emerald-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-lg text-emerald-50">{translations.saveProfile}</h4>
              <p className="text-emerald-200/80 text-sm">
                Save your data securely so you don't have to re-enter it.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <svg
                className="w-6 h-6 text-emerald-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-lg text-emerald-50">{translations.saveReports}</h4>
              <p className="text-emerald-200/80 text-sm">Access your previous diagnosis results.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <svg
                className="w-6 h-6 text-emerald-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-lg text-emerald-50">{translations.trackProgress}</h4>
              <p className="text-emerald-200/80 text-sm">
                Monitor your health improvements over time.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
