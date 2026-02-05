'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { useContracts } from '@/hooks/useContracts';
import { FileText, ArrowLeft, AlertTriangle, CheckCircle, XCircle, Download, Loader2 } from 'lucide-react';

export default function ContractDetailPage() {
  const params = useParams();
  const contractId = params.id as string;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ContractDetailContent contractId={contractId} />
        </main>
      </div>
    </ProtectedRoute>
  );
}

function ContractDetailContent({ contractId }: { contractId: string }) {
  const { getContract, getContractAnalysis, getContractStatus } = useContracts();
  
  const { data: contract, isLoading: isLoadingContract } = getContract(contractId);
  const { data: analysis } = getContractAnalysis(contractId);
  const { data: status } = getContractStatus(
    contractId,
    contract?.status === 'processing' ? 5000 : false
  );

  if (isLoadingContract) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!contract) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Contrat non trouvé</AlertTitle>
        <AlertDescription>
          Le contrat que vous recherchez n&apos;existe pas ou a été supprimé.
        </AlertDescription>
      </Alert>
    );
  }

  const isAnalyzing = contract.status === 'processing' || status?.status === 'processing';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/contracts">
        <Button variant="ghost" className="gap-2 -ml-4">
          <ArrowLeft className="h-4 w-4" />
          Retour aux contrats
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{contract.filename}</h1>
          <p className="text-slate-600 mt-1">
            {formatFileSize(contract.file_size)} • {' '}
            Téléchargé le {new Date(contract.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <StatusBadge status={contract.status} />
      </div>

      {/* Analyzing State */}
      {isAnalyzing && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Analyse en cours</AlertTitle>
          <AlertDescription>
            Notre IA est en train d&apos;analyser votre contrat. Cela peut prendre quelques minutes.
            La page se mettra à jour automatiquement.
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {contract.status === 'completed' && analysis && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="risks">Risques</TabsTrigger>
            <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
            <TabsTrigger value="document">Document</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Scores */}
            <div className="grid sm:grid-cols-2 gap-4">
              <ScoreCard
                title="Équilibre du contrat"
                score={analysis.results?.score_equilibre || analysis.score_equity || 0}
                description="Évalue si le contrat est équilibré entre les parties"
              />
              <ScoreCard
                title="Clarté du contrat"
                score={analysis.results?.score_clarity || analysis.score_clarity || 0}
                description="Évalue la lisibilité et la compréhension du contrat"
              />
            </div>

            {/* Contract Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du contrat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Type de contrat</h4>
                  <p className="text-slate-900">{analysis.results?.type_contrat || 'Non identifié'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-2">Parties</h4>
                  <div className="space-y-2">
                    {analysis.results?.parties?.map((party, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline">{party.role}</Badge>
                        <span className="text-slate-900">{party.name}</span>
                      </div>
                    )) || <p className="text-slate-500">Parties non identifiées</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Clauses à risque identifiées</CardTitle>
                <CardDescription>
                  Notre IA a détecté {analysis.results?.clauses_risque?.length || 0} clause(s) potentiellement risquée(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.results?.clauses_risque && analysis.results.clauses_risque.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {analysis.results.clauses_risque.map((clause, index) => (
                      <AccordionItem key={index} value={`clause-${index}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2 text-left">
                            <RiskLevelBadge level={clause.niveau} />
                            <span className="font-medium">{clause.clause}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-600 pl-16">
                          {clause.explication}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-slate-600">Aucun risque majeur identifié dans ce contrat.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recommandations</CardTitle>
                <CardDescription>
                  Suggestions pour améliorer ou sécuriser ce contrat
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.results?.recommandations && analysis.results.recommandations.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.results.recommandations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="p-1 bg-blue-100 rounded-full mt-0.5">
                          <AlertTriangle className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-slate-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">Aucune recommandation spécifique pour ce contrat.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="document">
            <Card>
              <CardHeader>
                <CardTitle>Document PDF</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[16/9] bg-slate-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">Visualisation du PDF</p>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Télécharger le fichier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {contract.status === 'failed' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Analyse échouée</AlertTitle>
          <AlertDescription>
            L&apos;analyse de ce contrat a échoué. Veuillez réessayer ou contacter le support si le problème persiste.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    pending: {
      label: 'En attente',
      className: 'bg-yellow-100 text-yellow-800',
      icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />,
    },
    processing: {
      label: 'En cours',
      className: 'bg-blue-100 text-blue-800',
      icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />,
    },
    completed: {
      label: 'Terminé',
      className: 'bg-green-100 text-green-800',
      icon: <CheckCircle className="h-3 w-3 mr-1" />,
    },
    failed: {
      label: 'Échec',
      className: 'bg-red-100 text-red-800',
      icon: <XCircle className="h-3 w-3 mr-1" />,
    },
  };

  const variant = variants[status] || variants.pending;

  return (
    <Badge variant="secondary" className={variant.className}>
      {variant.icon}
      {variant.label}
    </Badge>
  );
}

function ScoreCard({ title, score, description }: { title: string; score: number; description: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-yellow-500';
    if (s >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-4xl font-bold text-slate-900">{score}</span>
          <span className="text-slate-400 mb-1">/100</span>
        </div>
        <Progress value={score} className={`h-2 ${getColor(score)}`} />
        <p className="text-sm text-slate-600 mt-3">{description}</p>
      </CardContent>
    </Card>
  );
}

function RiskLevelBadge({ level }: { level: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    faible: { label: 'Faible', className: 'bg-green-100 text-green-800' },
    moyen: { label: 'Moyen', className: 'bg-yellow-100 text-yellow-800' },
    élevé: { label: 'Élevé', className: 'bg-orange-100 text-orange-800' },
    critique: { label: 'Critique', className: 'bg-red-100 text-red-800' },
  };

  const variant = variants[level.toLowerCase()] || variants.faible;

  return (
    <Badge variant="secondary" className={variant.className}>
      {variant.label}
    </Badge>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
