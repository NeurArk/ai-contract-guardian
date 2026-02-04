"use client";

import React from "react";
import {
  ExternalLink,
  FileText,
  Scale,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";

interface Source {
  url: string;
  title: string;
  source_type: "legifrance" | "jurisprudence" | "doctrine" | "other";
  date?: string;
  relevance?: number;
  is_official: boolean;
}

interface SourcesListProps {
  sources: Source[];
  showRelevance?: boolean;
  maxItems?: number;
  collapsible?: boolean;
}

const sourceTypeConfig = {
  legifrance: {
    icon: FileText,
    label: "Législation",
    color: "bg-blue-100 text-blue-700",
    borderColor: "border-blue-200",
  },
  jurisprudence: {
    icon: Scale,
    label: "Jurisprudence",
    color: "bg-purple-100 text-purple-700",
    borderColor: "border-purple-200",
  },
  doctrine: {
    icon: BookOpen,
    label: "Doctrine",
    color: "bg-amber-100 text-amber-700",
    borderColor: "border-amber-200",
  },
  other: {
    icon: FileText,
    label: "Autre",
    color: "bg-gray-100 text-gray-700",
    borderColor: "border-gray-200",
  },
};

function SourceItem({
  source,
  showRelevance,
}: {
  source: Source;
  showRelevance: boolean;
}) {
  const config = sourceTypeConfig[source.source_type];
  const Icon = config.icon;

  // Formater la date si présente
  const formattedDate = source.date
    ? new Date(source.date).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  // Vérifier si c'est une URL legifrance
  const isLegifrance = source.url?.includes("legifrance.gouv.fr");

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${config.borderColor} bg-white hover:shadow-sm transition-shadow`}
    >
      {/* Icône type */}
      <div className={`p-2 rounded-lg ${config.color}`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
              {source.title}
            </h4>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {/* Badge type */}
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
                {config.label}
              </span>

              {/* Badge officiel */}
              {source.is_official && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  Officiel
                </span>
              )}

              {/* Badge Legifrance */}
              {isLegifrance && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                  Legifrance
                </span>
              )}

              {/* Date */}
              {formattedDate && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {formattedDate}
                </span>
              )}
            </div>
          </div>

          {/* Pertinence */}
          {showRelevance && source.relevance !== undefined && (
            <div className="flex-shrink-0">
              <div
                className={`text-xs font-medium px-2 py-1 rounded ${
                  source.relevance >= 80
                    ? "bg-green-100 text-green-700"
                    : source.relevance >= 60
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {source.relevance}% pert.
              </div>
            </div>
          )}
        </div>

        {/* URL */}
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2 group"
          >
            <span className="truncate max-w-[300px]">
              {source.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </a>
        )}
      </div>
    </div>
  );
}

export function SourcesList({
  sources,
  showRelevance = true,
  maxItems,
  collapsible = true,
}: SourcesListProps) {
  const [isExpanded, setIsExpanded] = React.useState(!collapsible);

  if (!sources || sources.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Aucune source disponible</p>
        <p className="text-xs text-gray-500 mt-1">
          Les sources seront ajoutées lors de l'analyse
        </p>
      </div>
    );
  }

  // Trier par pertinence et officialité
  const sortedSources = [...sources].sort((a, b) => {
    if (a.is_official !== b.is_official) {
      return a.is_official ? -1 : 1;
    }
    return (b.relevance || 0) - (a.relevance || 0);
  });

  const displaySources = maxItems && !isExpanded
    ? sortedSources.slice(0, maxItems)
    : sortedSources;

  const hasMore = maxItems && sortedSources.length > maxItems;

  // Statistiques
  const officialCount = sources.filter((s) => s.is_official).length;
  const legifranceCount = sources.filter((s) =>
    s.url?.includes("legifrance.gouv.fr")
  ).length;

  return (
    <div className="space-y-3">
      {/* En-tête avec stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-gray-900">
            Sources juridiques ({sources.length})
          </h3>
          {officialCount > 0 && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
              {officialCount} officielle{officialCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {legifranceCount > 0 && (
          <span className="text-xs text-blue-600 font-medium">
            {legifranceCount} sur Legifrance
          </span>
        )}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200" />
          <span className="text-gray-600">Législation</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-purple-100 border border-purple-200" />
          <span className="text-gray-600">Jurisprudence</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-200" />
          <span className="text-gray-600">Doctrine</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-600" />
          <span className="text-gray-600">Source officielle</span>
        </div>
      </div>

      {/* Liste des sources */}
      <div className="space-y-2">
        {displaySources.map((source, index) => (
          <SourceItem
            key={`${source.url}-${index}`}
            source={source}
            showRelevance={showRelevance}
          />
        ))}
      </div>

      {/* Bouton voir plus */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-medium border border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          {isExpanded
            ? "Voir moins"
            : `Voir ${sortedSources.length - maxItems} source${
                sortedSources.length - maxItems > 1 ? "s" : ""
              } de plus`}
        </button>
      )}
    </div>
  );
}

// Variante compacte pour les cartes de clause
export function SourcesMiniList({ sources }: { sources: Source[] }) {
  const officialSources = sources.filter((s) => s.is_official).slice(0, 3);

  if (officialSources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {officialSources.map((source, idx) => (
        <a
          key={idx}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
        >
          {source.source_type === "legifrance" ? (
            <FileText className="w-3 h-3" />
          ) : source.source_type === "jurisprudence" ? (
            <Scale className="w-3 h-3" />
          ) : (
            <BookOpen className="w-3 h-3" />
          )}
          <span className="truncate max-w-[150px]">{source.title}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      ))}
      {sources.filter((s) => s.is_official).length > 3 && (
        <span className="text-xs text-gray-500 px-2 py-1">
          +{sources.filter((s) => s.is_official).length - 3} autres
        </span>
      )}
    </div>
  );
}

export default SourcesList;
