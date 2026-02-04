'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useContracts } from '@/hooks/useContracts';
import { FileText, Upload, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DashboardContent />
        </main>
      </div>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { contracts, isLoading } = useContracts();

  const totalContracts = contracts.length;
  const completedContracts = contracts.filter((c) => c.status === 'completed').length;
  const pendingContracts = contracts.filter((c) => c.status === 'pending' || c.status === 'processing').length;
  const recentContracts = contracts.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-600 mt-1">Vue d&apos;ensemble de vos contrats</p>
        </div>
        <Link href="/contracts/upload">
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Nouvelle analyse
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          title="Contrats totaux"
          value={isLoading ? null : totalContracts}
          icon={<FileText className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          title="Analyses terminées"
          value={isLoading ? null : completedContracts}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
        />
        <StatCard
          title="En attente"
          value={isLoading ? null : pendingContracts}
          icon={<Clock className="h-5 w-5 text-orange-600" />}
        />
      </div>

      {/* Recent Contracts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contrats récents</CardTitle>
              <CardDescription>Vos 5 derniers contrats analysés</CardDescription>
            </div>
            <Link href="/contracts">
              <Button variant="ghost" size="sm" className="gap-1">
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : recentContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Aucun contrat encore
              </h3>
              <p className="text-slate-600 mb-4">
                Commencez par analyser votre premier contrat
              </p>
              <Link href="/contracts/upload">
                <Button>Analyser un contrat</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentContracts.map((contract) => (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{contract.filename}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(contract.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={contract.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | null;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-100 rounded-lg">{icon}</div>
          <div>
            <p className="text-sm text-slate-600">{title}</p>
            {value === null ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    pending: {
      label: 'En attente',
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
    processing: {
      label: 'En cours',
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
    completed: {
      label: 'Terminé',
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
      icon: <CheckCircle className="h-3 w-3 mr-1" />,
    },
    failed: {
      label: 'Échec',
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
      icon: <AlertCircle className="h-3 w-3 mr-1" />,
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
