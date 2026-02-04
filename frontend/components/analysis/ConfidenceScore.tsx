"use client";

import React from "react";
import { AlertTriangle, Shield, Info, CheckCircle } from "lucide-react";

interface ConfidenceScoreProps {
  score: number;
  level: "high" | "medium" | "low" | "insufficient";
  factors?: Record<string, number>;
  recommendation?: string;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
}

const levelConfig = {
  high: {
    color: "#22c55e",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    icon: CheckCircle,
    label: "Confiance élevée",
    description: "Sources fiables et à jour",
  },
  medium: {
    color: "#eab308",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-700",
    icon: Info,
    label: "Confiance moyenne",
    description: "Vérification recommandée",
  },
  low: {
    color: "#f97316",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    icon: AlertTriangle,
    label: "Confiance faible",
    description: "Conseil avocat recommandé",
  },
  insufficient: {
    color: "#ef4444",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    icon: Shield,
    label: "Confiance insuffisante",
    description: "Expertise juridique nécessaire",
  },
};

const sizeConfig = {
  sm: { size: 60, stroke: 4, fontSize: 14 },
  md: { size: 100, stroke: 6, fontSize: 20 },
  lg: { size: 140, stroke: 8, fontSize: 28 },
};

export function ConfidenceScore({
  score,
  level,
  factors,
  recommendation,
  showDetails = true,
  size = "md",
}: ConfidenceScoreProps) {
  const config = levelConfig[level];
  const Icon = config.icon;
  const sizeCfg = sizeConfig[size];

  // Calcul du cercle de progression
  const radius = (sizeCfg.size - sizeCfg.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor}`}
    >
      <div className="flex items-center gap-4">
        {/* Jauge circulaire */}
        <div className="relative flex-shrink-0">
          <svg
            width={sizeCfg.size}
            height={sizeCfg.size}
            className="transform -rotate-90"
          >
            {/* Cercle de fond */}
            <circle
              cx={sizeCfg.size / 2}
              cy={sizeCfg.size / 2}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={sizeCfg.stroke}
            />
            {/* Cercle de progression */}
            <circle
              cx={sizeCfg.size / 2}
              cy={sizeCfg.size / 2}
              r={radius}
              fill="none"
              stroke={config.color}
              strokeWidth={sizeCfg.stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          {/* Score au centre */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-bold"
              style={{
                fontSize: sizeCfg.fontSize,
                color: config.color,
              }}
            >
              {score}%
            </span>
          </div>
        </div>

        {/* Informations */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.textColor}`} />
            <span className={`font-semibold ${config.textColor}`}>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{config.description}</p>
          {recommendation && (
            <p className="text-sm font-medium text-gray-700 mt-2">
              💡 {recommendation}
            </p>
          )}
        </div>
      </div>

      {/* Détails des facteurs */}
      {showDetails && factors && Object.keys(factors).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Détail du calcul:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(factors).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-gray-600 capitalize">
                  {key.replace(/_/g, " ")}:
                </span>
                <span
                  className={`font-medium ${
                    value > 0
                      ? "text-green-600"
                      : value < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {value > 0 ? "+" : ""}
                  {value} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Variante compacte pour les listes
export function ConfidenceBadge({
  score,
  level,
}: {
  score: number;
  level: ConfidenceScoreProps["level"];
}) {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      <Icon className="w-3 h-3" />
      {score}%
    </span>
  );
}

// Variante pour affichage global
export function GlobalConfidenceCard({
  score,
  level,
  clauseCount,
  officialSources,
}: {
  score: number;
  level: ConfidenceScoreProps["level"];
  clauseCount: number;
  officialSources: number;
}) {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <div
      className={`rounded-xl border-2 p-6 ${config.bgColor} ${config.borderColor}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">Score de confiance global</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${config.textColor}`}>
              {score}%
            </span>
            <span className={`text-lg font-medium ${config.textColor}`}>
              {config.label}
            </span>
          </div>
        </div>
        <div
          className={`p-3 rounded-full ${config.bgColor} ${config.textColor}`}
        >
          <Icon className="w-8 h-8" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-white/50 rounded-lg p-3">
          <p className="text-2xl font-bold text-gray-800">{clauseCount}</p>
          <p className="text-sm text-gray-600">Clauses analysées</p>
        </div>
        <div className="bg-white/50 rounded-lg p-3">
          <p className="text-2xl font-bold text-gray-800">{officialSources}</p>
          <p className="text-sm text-gray-600">Sources officielles</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-white/70 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Recommandation:</span>{" "}
          {level === "high"
            ? "L'analyse est fiable. Vous pouvez l'utiliser en toute confiance."
            : level === "medium"
              ? "Vérifiez les points marqués avant de prendre une décision."
              : "Faites vérifier cette analyse par un professionnel du droit."}
        </p>
      </div>
    </div>
  );
}

export default ConfidenceScore;
