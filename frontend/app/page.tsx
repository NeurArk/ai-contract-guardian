import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, FileText, Brain, CheckCircle, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">AI Contract Guardian</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button>Commencer gratuitement</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Analysez vos contrats en
            <span className="text-blue-600"> quelques secondes</span>
          </h1>
          <p className="text-xl text-slate-600 mb-4 max-w-3xl mx-auto">
            Protégez votre entreprise avec notre IA spécialisée dans l&apos;analyse contractuelle.
            Détectez les risques, comprenez vos obligations, négociez mieux.
          </p>
          <p className="text-sm text-slate-500 mb-8">
            Service réservé aux professionnels (B2B).
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Essayer gratuitement
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Pourquoi choisir AI Contract Guardian ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FileText className="h-10 w-10 text-blue-600" />}
              title="Analyse Instantanée"
              description="Téléchargez votre contrat et obtenez une analyse complète en moins de 2 minutes."
            />
            <FeatureCard
              icon={<Brain className="h-10 w-10 text-blue-600" />}
              title="IA Spécialisée"
              description="Notre IA est entraînée spécifiquement sur le droit des contrats français."
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-blue-600" />}
              title="Détection des Risques"
              description="Identifiez automatiquement les clauses à risque et les déséquilibres."
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Conçu pour les TPE/PME
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <BenefitItem text="Sans engagement, payez à l'usage" />
            <BenefitItem text="Interface simple et intuitive" />
            <BenefitItem text="Rapports clairs et actionnables" />
            <BenefitItem text="Conforme RGPD" />
            <BenefitItem text="Support client réactif" />
            <BenefitItem text="Mises à jour régulières" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à sécuriser vos contrats ?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Rejoignez les entreprises qui font confiance à AI Contract Guardian
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="gap-2">
              Créer un compte gratuit
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500">
          <p>© 2025 AI Contract Guardian. Tous droits réservés.</p>
          <div className="mt-2 flex items-center justify-center gap-4 text-sm">
            <Link className="underline hover:text-slate-700" href="/legal/cgu">
              CGU
            </Link>
            <span className="text-slate-300">•</span>
            <Link className="underline hover:text-slate-700" href="/legal/privacy">
              Confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
      <span className="text-slate-700">{text}</span>
    </div>
  );
}
