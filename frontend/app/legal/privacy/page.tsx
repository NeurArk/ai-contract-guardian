import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PrivacyPage() {
  const lastUpdate = '06/02/2026';
  const lanHost = '192.168.1.156';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          <header className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-3xl font-bold text-slate-900">Politique de Confidentialité</h1>
              <Badge variant="secondary" className="w-fit bg-slate-200 text-slate-700 hover:bg-slate-200">
                Mise à jour : {lastUpdate}
              </Badge>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Cette Politique de Confidentialité explique quelles données sont traitées dans le cadre du service « AI
              Contract Guardian » et comment elles sont utilisées. Elle est conçue pour être claire et adaptée aux
              besoins des TPE/PME.
            </p>
            <p className="text-sm text-slate-500">
              Contact :{' '}
              <a className="underline hover:text-slate-700" href="mailto:contact@neurark.com">
                contact@neurark.com
              </a>
            </p>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>1. Responsable du traitement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                Le responsable du traitement est l&apos;éditeur du Service (Neurark). Pour toute demande relative à la
                protection des données :{' '}
                <a className="underline hover:text-slate-700" href="mailto:contact@neurark.com">
                  contact@neurark.com
                </a>
                .
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Données collectées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>Dans le cadre de l&apos;utilisation du Service, nous pouvons traiter :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Adresse e-mail</strong> (création de compte, authentification, communications liées au Service).
                </li>
                <li>
                  <strong>Fichiers importés</strong> (contrats et documents transmis pour analyse).
                </li>
                <li>
                  <strong>Résultats d&apos;analyse</strong> (synthèses, alertes, extractions et autres éléments générés).
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Finalités et base juridique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>Les traitements ont pour finalités principales :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>fournir le Service d&apos;analyse contractuelle (import, traitement, restitution des résultats) ;</li>
                <li>assurer la sécurité, la traçabilité et le bon fonctionnement (journalisation technique limitée) ;</li>
                <li>gérer l&apos;accès au compte (authentification, session).</li>
              </ul>
              <p>
                La base juridique est principalement l&apos;exécution du contrat (fourniture du Service) et, le cas échéant,
                l&apos;intérêt légitime à assurer la sécurité et la prévention des abus.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Hébergement et localisation des données</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                Le Service est déployé en <strong>environnement local (LAN)</strong>. Les données traitées par le Service
                (fichiers importés et résultats) sont hébergées localement sur l&apos;infrastructure interne, notamment sur
                l&apos;hôte : <strong>{lanHost}</strong>.
              </p>
              <p>
                <strong>Aucun cloud externe</strong> n&apos;est utilisé pour héberger les fichiers importés et les résultats
                d&apos;analyse.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Durée de conservation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                Les données sont conservées pendant la durée nécessaire à la fourniture du Service, puis supprimées :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>à la demande de l&apos;Utilisateur (exercice des droits RGPD) ;</li>
                <li>ou lors de la suppression du compte.</li>
              </ul>
              <p className="text-sm text-slate-500">
                Certaines données techniques strictement nécessaires (ex. logs de sécurité) peuvent être conservées pour
                une durée limitée afin de répondre à des exigences de sécurité et d&apos;audit.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Cookies et traceurs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                Le Service utilise uniquement un cookie technique de session (JWT) nécessaire à l&apos;authentification et au
                maintien de la session.
              </p>
              <p>
                Nous n&apos;utilisons pas de cookies publicitaires, ni de traceurs de mesure d&apos;audience à des fins de
                tracking.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Destinataires, sous-traitants et transferts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                Les données sont destinées aux personnes habilitées à opérer le Service et, le cas échéant, aux
                administrateurs internes de l&apos;organisation dans le cadre de l&apos;exploitation du pilote.
              </p>
              <p>
                Dans le cadre décrit ci-dessus (hébergement local), nous n&apos;effectuons pas de transfert de vos fichiers et
                résultats vers des services cloud externes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Vos droits (RGPD)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                Conformément au RGPD, vous disposez notamment des droits d&apos;accès, de rectification, d&apos;effacement, de
                limitation, d&apos;opposition et, le cas échéant, de portabilité.
              </p>
              <p>
                Pour exercer vos droits, contactez-nous à :{' '}
                <a className="underline hover:text-slate-700" href="mailto:contact@neurark.com">
                  contact@neurark.com
                </a>
                .
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Sécurité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour protéger les données
                (contrôles d&apos;accès, gestion de session, séparation des environnements, sauvegardes selon configuration
                interne).
              </p>
              <p>
                Aucun système n&apos;étant parfaitement sécurisé, nous invitons les Utilisateurs à appliquer de bonnes
                pratiques (mots de passe robustes, accès réseau maîtrisé, poste de travail à jour).
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
