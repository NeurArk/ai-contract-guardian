import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CguPage() {
  const lastUpdate = '06/02/2026';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          <header className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-3xl font-bold text-slate-900">Conditions Générales d&apos;Utilisation (CGU)</h1>
              <Badge variant="secondary" className="w-fit bg-slate-200 text-slate-700 hover:bg-slate-200">
                Mise à jour : {lastUpdate}
              </Badge>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») encadrent l&apos;utilisation du service
              « AI Contract Guardian » (ci-après le « Service »), solution d&apos;analyse contractuelle assistée par
              intelligence artificielle, proposée dans le cadre d&apos;un pilote en environnement local (LAN).
            </p>
            <p className="text-sm text-slate-500">
              Pour toute question :{' '}
              <a className="underline hover:text-slate-700" href="mailto:contact@neurark.com">
                contact@neurark.com
              </a>
              .
            </p>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>1. Objet et périmètre du Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                Le Service a pour objet de permettre à des TPE/PME d&apos;importer des documents contractuels afin d&apos;obtenir
                une synthèse, des points d&apos;attention et des éléments d&apos;aide à la lecture générés par un système
                d&apos;intelligence artificielle.
              </p>
              <p>
                Le Service est fourni à titre d&apos;outil d&apos;assistance. Il ne constitue pas une consultation juridique et ne
                remplace pas l&apos;intervention d&apos;un professionnel du droit.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Caractère indicatif des analyses — absence de conseil juridique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                Les résultats (analyses, synthèses, scores, alertes, recommandations) sont produits automatiquement et
                peuvent contenir des erreurs, omissions ou approximations.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Les informations fournies sont{' '}
                  <strong>indicatives</strong> et destinées à faciliter la compréhension d&apos;un document.
                </li>
                <li>
                  L&apos;Utilisateur demeure seul responsable des décisions prises sur la base des résultats, et de la
                  vérification de leur pertinence au regard de sa situation.
                </li>
                <li>
                  En cas de doute, de risque important ou d&apos;enjeu financier/significatif, l&apos;Utilisateur est invité à
                  solliciter un avocat ou tout conseil compétent.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Accès au Service et compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                L&apos;accès au Service nécessite la création d&apos;un compte (notamment via une adresse e-mail). L&apos;Utilisateur
                s&apos;engage à fournir des informations exactes et à préserver la confidentialité de ses identifiants.
              </p>
              <p>
                Le Service étant exploité dans un environnement local (LAN), l&apos;accès peut être limité au réseau interne
                de l&apos;organisation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Données, propriété et stockage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Propriété des contenus :</strong> l&apos;Utilisateur reste propriétaire des fichiers importés et des
                  contenus transmis au Service.
                </li>
                <li>
                  <strong>Stockage :</strong> les fichiers et résultats d&apos;analyse sont stockés de manière temporaire et/ou
                  aussi longtemps que nécessaire au fonctionnement du Service, puis supprimés à la demande de
                  l&apos;Utilisateur ou lors de la suppression du compte, conformément aux obligations applicables.
                </li>
                <li>
                  <strong>Licence technique :</strong> l&apos;Utilisateur concède au Service une autorisation strictement limitée à
                  la durée et au périmètre nécessaires pour traiter les fichiers, générer les analyses et restituer les
                  résultats.
                </li>
              </ul>
              <p className="text-sm text-slate-500">
                Pour plus de détails sur les traitements, consulter la{' '}
                <Link className="underline hover:text-slate-700" href="/legal/privacy">
                  Politique de Confidentialité
                </Link>
                .
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Responsabilités</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                Le fournisseur du Service met en œuvre des efforts raisonnables pour assurer son bon fonctionnement.
                Toutefois, l&apos;Utilisateur reconnaît que :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>le Service peut être interrompu (maintenance, incident, mise à jour) ;</li>
                <li>les analyses peuvent être inexactes ou incomplètes ;</li>
                <li>
                  l&apos;Utilisateur est responsable des fichiers importés (droits, confidentialité, conformité) ainsi que de
                  l&apos;usage qu&apos;il fait des résultats.
                </li>
              </ul>
              <p>
                Sauf dispositions légales impératives contraires, la responsabilité du fournisseur ne saurait être engagée
                en cas de dommage indirect, perte de chance, perte de profit, ou conséquence d&apos;une décision prise sur la
                base d&apos;une analyse indicative.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Durée — suppression du compte (RGPD)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                Le compte est créé pour une durée indéterminée et demeure actif jusqu&apos;à sa suppression par
                l&apos;Utilisateur.
              </p>
              <p>
                L&apos;Utilisateur peut demander la suppression de son compte et/ou de ses données conformément à la
                réglementation applicable (RGPD). La suppression entraîne, dans les conditions prévues, l&apos;effacement des
                données associées.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Modifications des CGU</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                Les CGU peuvent être amenées à évoluer, notamment en cas d&apos;évolutions du Service, de sécurité ou
                réglementaires. La version applicable est celle publiée sur cette page.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Droit applicable — litiges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                Les présentes CGU sont soumises au droit français. Tout litige relatif à leur interprétation et/ou leur
                exécution relève de la compétence exclusive des tribunaux de Paris, sauf dispositions légales impératives
                contraires.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
