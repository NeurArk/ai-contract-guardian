"use client";

import React from "react";
import { AlertTriangle, Shield, Scale, Info, X } from "lucide-react";

interface LegalDisclaimerProps {
  variant?: "full" | "compact" | "banner" | "inline";
  onDismiss?: () => void;
  dismissible?: boolean;
  className?: string;
}

const DISCLAIMER_TEXT = {
  full: `⚠️ AVERTISSEMENT LÉGAL: Ce rapport est généré automatiquement par une intelligence artificielle à titre purement indicatif et informatif. Il ne constitue pas un avis juridique, ne remplace pas la consultation d'un avocat ou notaire, et ne saurait engager la responsabilité de AI Contract Guardian. Les informations fournies peuvent contenir des erreurs ou omissions. Nous vous recommandons vivement de faire vérifier cette analyse par un professionnel du droit avant toute décision.`,
  short: `⚠️ Cette analyse est générée par IA à titre indicatif uniquement. Elle ne remplace pas un avis juridique professionnel.`,
  minimal: `⚠️ Information à titre indicatif - ne remplace pas un avocat`,
};

export function LegalDisclaimer({
  variant = "full",
  onDismiss,
  dismissible = false,
  className = "",
}: LegalDisclaimerProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Variante complète
  if (variant === "full") {
    return (
      <div
        className={`relative bg-amber-50 border-2 border-amber-200 rounded-xl p-6 ${className}`}
      >
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="p-3 bg-amber-100 rounded-full">
              <Scale className="w-8 h-8 text-amber-700" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Avertissement Légal Important
            </h3>
            <p className="text-amber-800 leading-relaxed">
              {DISCLAIMER_TEXT.full}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <Shield className="w-4 h-4" />
                <span>Analyse IA - Vérification humaine recommandée</span>
              </div>
            </div>
          </div>
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
              aria-label="Fermer l'avertissement"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Variante compacte
  if (variant === "compact") {
    return (
      <div
        className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-800">{DISCLAIMER_TEXT.short}</p>
          </div>
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-amber-600 hover:text-amber-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Variante bannière
  if (variant === "banner") {
    return (
      <div
        className={`bg-gradient-to-r from-amber-500 to-orange-500 text-white ${className}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5" />
              <p className="text-sm font-medium">{DISCLAIMER_TEXT.minimal}</p>
            </div>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Variante inline
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded ${className}`}
    >
      <AlertTriangle className="w-3 h-3" />
      {DISCLAIMER_TEXT.minimal}
    </span>
  );
}

// Composant avec accord utilisateur
export function LegalDisclaimerWithConsent({
  onAccept,
  className = "",
}: {
  onAccept: () => void;
  className?: string;
}) {
  const [accepted, setAccepted] = React.useState(false);

  const handleAccept = () => {
    setAccepted(true);
    onAccept();
  };

  if (accepted) {
    return (
      <div
        className={`bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 ${className}`}
      >
        <Shield className="w-5 h-5 text-green-600" />
        <span className="text-sm text-green-700">
          Vous avez pris connaissance de l'avertissement légal
        </span>
      </div>
    );
  }

  return (
    <div
      className={`bg-amber-50 border-2 border-amber-300 rounded-xl p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-100 rounded-full">
          <Scale className="w-8 h-8 text-amber-700" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-900 mb-2">
            Avertissement Légal
          </h3>
          <p className="text-amber-800 mb-4">{DISCLAIMER_TEXT.full}</p>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="mt-1 w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
              onChange={handleAccept}
            />
            <span className="text-sm text-amber-800 group-hover:text-amber-900">
              J'ai lu et je comprends que cette analyse est générée par
              intelligence artificielle à titre indicatif uniquement et ne
              remplace pas un avis juridique professionnel.
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

// Footer avec disclaimer
export function LegalFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`border-t border-gray-200 bg-gray-50 py-4 px-6 ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Scale className="w-4 h-4" />
          <span>{DISCLAIMER_TEXT.minimal}</span>
        </div>
        <div className="text-xs text-gray-400">
          AI Contract Guardian © {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}

export default LegalDisclaimer;
