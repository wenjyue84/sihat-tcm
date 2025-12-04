import DiagnosisWizard from '@/components/diagnosis/DiagnosisWizard'

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 font-sans">
      <header className="p-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-emerald-800">Sihat TCM</h1>
        <p className="text-stone-600 mt-2">Your AI-Powered Traditional Chinese Medicine Companion</p>
      </header>
      <section className="container mx-auto py-8">
        <DiagnosisWizard />
      </section>
    </main>
  )
}
