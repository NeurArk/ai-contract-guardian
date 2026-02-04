'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useContracts } from '@/hooks/useContracts';
import { FileText, Upload, Search, ArrowRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ContractsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ContractsContent />
        </main>
      </div>
    </ProtectedRoute>
  );
}

function ContractsContent() {
  const { contracts, isLoading } = useContracts();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch = contract.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mes contrats</h1>
          <p className="text-slate-600 mt-1">Gérez et consultez tous vos contrats analysés</p>
        </div>
        <Link href="/contracts/upload">
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Nouvelle analyse
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un contrat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="failed">Échec</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des contrats ({filteredContracts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchQuery || statusFilter !== 'all'
                  ? 'Aucun contrat ne correspond à vos critères'
                  : 'Aucun contrat encore'}
              </h3>
              <p className="text-slate-600 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Commencez par analyser votre premier contrat'}
              </p>
              <Link href="/contracts/upload">
                <Button>Analyser un contrat</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {filteredContracts.map((contract) => (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{contract.filename}</p>
                      <p className="text-sm text-slate-500">
                        {formatFileSize(contract.file_size)} • {' '}
                        {new Date(contract.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={contract.status} />
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
