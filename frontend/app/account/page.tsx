'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/lib/auth';
import { usersApi } from '@/lib/api';
import { toast } from 'sonner';
import { Download, Trash2, AlertTriangle } from 'lucide-react';

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AccountContent />
        </main>
      </div>
    </ProtectedRoute>
  );
}

function AccountContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await usersApi.exportMe();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aicg-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Export généré');
    } catch (e) {
      toast.error('Impossible de générer l’export');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm(
      'Supprimer définitivement votre compte et toutes vos données ? Cette action est irréversible.'
    );
    if (!ok) return;

    setIsDeleting(true);
    try {
      await usersApi.deleteMe();
      toast.success('Compte supprimé');
      // Ensure local session is cleared.
      // Clear local session without triggering the default logout redirect.
      useAuthStore.getState().logout();
      router.push('/register');
    } catch (e) {
      toast.error('Impossible de supprimer le compte');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Mon compte</h1>
        <p className="text-slate-600 mt-1">Gérez vos données et votre compte.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Informations de base</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span className="font-medium">{user?.email || '—'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes données (RGPD)</CardTitle>
          <CardDescription>
            Exportez vos données ou supprimez définitivement votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleExport} disabled={isExporting} className="gap-2">
              <Download className="h-4 w-4" />
              {isExporting ? 'Export…' : 'Exporter mes données'}
            </Button>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Suppression…' : 'Supprimer mon compte'}
            </Button>
          </div>

          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <AlertDescription className="text-amber-900">
              La suppression supprime vos contrats et analyses stockés sur ce serveur.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
