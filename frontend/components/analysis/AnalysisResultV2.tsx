"use client";

import React from "react";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Scale,
  ArrowLeft,
  Download,
  Share2,
  Printer,
} from "lucide-react";
import { GlobalConfidenceCard } from "./ConfidenceScore";
import { SourcesList } from "./SourcesList";
import { LegalDisclaimer } from "./LegalDisclaimer";

interface ArticleApplicable {
  code: string;
  article: string;
  alinea?: string;
  texte_loi: string;
  date_publication: string;
  url_source: string;
}

interface Jurisprudence {
  juridiction: string;
  numero_arret: string;
  date: string;
  sommaire: string;
  url_source: string;
}

interface AnalyseClause {
  clause_detectee: string;
  texte_clause: string;
  analyse_juridique: string;
  articles_applicables: ArticleApplicable[];
  jurisprudences: Jurisprudence[];
  score_confiance_clause: number;
  niveau_confiance_clause: "élevé" | "moyen" | "faible" | "insuffisant";
  zones_incertitudes: string[];
  alertes: string[];
  recommandations_action: string[];
}

interface Source {
  url: string;
  title: string;
  source_type: "legifrance" | "jurisprudence" | "doctrine" | "other";
  date?: string;
  relevance?: number;
  is_official: boolean;
}

interface AnalysisResult {
  disclaimer: string;
  score_confiance_global: number;
  niveau_confiance: "élevé" | "moyen" | "faible" | "insuffisant";
  recommandation_verification: boolean;
  analyses: AnalyseClause[];
  resume_executif: string;
  risques_majeurs: string[];
  recommandations_prioritaires: string[];
  sources: Source[];
}

interface AnalysisResultV2Props {
  result: AnalysisResult;
  contractName?: string;
  onBack?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

type ConfidenceLevel = "high" | "medium" | "low" | "insufficient";

const confidenceLevelMap: Record<AnalysisResult["niveau_confiance"], ConfidenceLevel> = {
  élevé: "high",
  moyen: "medium",
  faible: "low",
  insuffisant: "insufficient",
};

function ClauseCard({ analyse }: { analyse: AnalyseClause }) {
  const levelColors = {
    élevé: "border-green-200 bg-green-50",
    moyen: "border-yellow-200 bg-yellow-50",
    faible: "border-orange-200 bg-orange-50",
    insuffisant: "border-red-200 bg-red-50",
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${levelColors[analyse.niveau_confiance_clause]}`}>
      {/* En-tête */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {analyse.clause_detectee}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {analyse.texte_clause.substring(0, 150)}
            {analyse.texte_clause.length > 150 ? "..." : ""}
          </p>
        </div>
        <div className="flex-shrink-0 ml-4">
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              analyse.niveau_confiance_clause === "élevé"
                ? "bg-green-100 text-green-700"
                : analyse.niveau_confiance_clause === "moyen"
                  ? "bg-yellow-100 text-yellow-700"
                  : analyse.niveau_confiance_clause === "faible"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-red-100 text-red-700"
            }`}
          >
            {analyse.score_confiance_clause}% confiance
          </div>
        </div>
      </div>

      {/* Analyse */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Analyse juridique
        </h4>
        <p className="text-gray-700 text-sm leading-relaxed">
          {analyse.analyse_juridique}
        </p>
      </div>

      {/* Articles applicables */}
      {analyse.articles_applicables.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Articles applicables
          </h4>
          <div className="space-y-2">
            {analyse.articles_applicables.map((article, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-3 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {article.code}, article {article.article}
                      {article.alinea && `, ${article.alinea}`}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {article.texte_loi.substring(0, 120)}
                      {article.texte_loi.length > 120 ? "..." : ""}
                    </p>
                  </div>
                  <a
                    href={article.url_source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Voir sur Legifrance
                  </a>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Publié le{" "}
                  {new Date(article.date_publication).toLocaleDateString(
                    "fr-FR"
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jurisprudences */}
      {analyse.jurisprudences.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-600" />
            Jurisprudences
          </h4>
          <div className="space-y-2">
            {analyse.jurisprudences.map((juris, idx) => (
              <div
                key={idx}
                className="bg-purple-50 rounded-lg p-3 border border-purple-200"
              >
                <p className="font-medium text-gray-900 text-sm">
                  {juris.juridiction}
                </p>
                <p className="text-xs text-purple-700">
                  Arrêt n° {juris.numero_arret} du{" "}
                  {new Date(juris.date).toLocaleDateString("fr-FR")}
                </p>
                <p className="text-sm text-gray-700 mt-1">{juris.sommaire}</p>
                {juris.url_source && (
                  <a
                    href={juris.url_source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-600 hover:underline mt-1 inline-block"
                  >
                    Voir l&apos;arrêt
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertes */}
      {analyse.alertes.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alertes
          </h4>
          <ul className="space-y-1">
            {analyse.alertes.map((alerte, idx) => (
              <li
                key={idx}
                className="text-sm text-red-600 bg-red-50 p-2 rounded"
              >
                {alerte}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Incertitudes */}
      {analyse.zones_incertitudes.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-amber-700 mb-2">Zones d&apos;incertitude</h4>
          <ul className="space-y-1">
            {analyse.zones_incertitudes.map((zone, idx) => (
              <li
                key={idx}
                className="text-sm text-amber-600 bg-amber-50 p-2 rounded"
              >
                {zone}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommandations */}
      {analyse.recommandations_action.length > 0 && (
        <div>
          <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Recommandations
          </h4>
          <ul className="space-y-1">
            {analyse.recommandations_action.map((rec, idx) => (
              <li
                key={idx}
                className="text-sm text-green-700 bg-green-50 p-2 rounded"
              >
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AnalysisResultV2({
  result,
  contractName = "Contrat",
  onBack,
  onDownload,
  onShare,
}: AnalysisResultV2Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Analyse juridique
                </h1>
                <p className="text-sm text-gray-500">{contractName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onShare && (
                <button
                  onClick={onShare}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Partager</span>
                </button>
              )}
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Télécharger</span>
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Printer className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Disclaimer */}
        <div className="mb-8">
          <LegalDisclaimer variant="full" />
        </div>

        {/* Score global */}
        <div className="mb-8">
          <GlobalConfidenceCard
            score={result.score_confiance_global}
            level={confidenceLevelMap[result.niveau_confiance]}
            clauseCount={result.analyses.length}
            officialSources={
              result.sources.filter((s) => s.is_official).length
            }
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Résumé exécutif */}
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Résumé exécutif
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {result.resume_executif}
              </p>
            </section>

            {/* Risques majeurs */}
            {result.risques_majeurs.length > 0 && (
              <section className="bg-red-50 rounded-xl border border-red-200 p-6">
                <h2 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Risques majeurs identifiés
                </h2>
                <ul className="space-y-2">
                  {result.risques_majeurs.map((risque, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span className="text-red-700">{risque}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Analyses détaillées */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Analyse détaillée des clauses
              </h2>
              <div className="space-y-6">
                {result.analyses.map((analyse, idx) => (
                  <ClauseCard key={idx} analyse={analyse} />
                ))}
              </div>
            </section>

            {/* Recommandations prioritaires */}
            {result.recommandations_prioritaires.length > 0 && (
              <section className="bg-green-50 rounded-xl border border-green-200 p-6">
                <h2 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Recommandations prioritaires
                </h2>
                <ol className="space-y-2">
                  {result.recommandations_prioritaires.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {idx + 1}
                      </span>
                      <span className="text-green-700">{rec}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Sources */}
            <section className="bg-white rounded-xl border p-6">
              <SourcesList sources={result.sources} />
            </section>

            {/* Vérification recommandée */}
            {result.recommandation_verification && (
              <section className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                <h3 className="font-bold text-amber-800 mb-2">
                  ⚠️ Vérification recommandée
                </h3>
                <p className="text-sm text-amber-700">
                  Certaines clauses présentent un faible score de confiance.
                  Nous vous recommandons de faire vérifier cette analyse par un
                  professionnel du droit.
                </p>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AnalysisResultV2;
