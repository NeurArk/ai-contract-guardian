'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUpload } from '@/hooks/useUpload';
import { Upload, File, X, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { LegalDisclaimerWithConsent } from '@/components/analysis/LegalDisclaimer';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UploadContent />
        </main>
      </div>
    </ProtectedRoute>
  );
}

function UploadContent() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasLegalConsent, setHasLegalConsent] = useState(false);
  const { upload, progress, isUploading, error, reset } = useUpload();

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Seuls les fichiers PDF ou DOCX sont acceptés';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Le fichier ne doit pas dépasser 10 Mo';
    }
    return null;
  }, []);

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    setFile(file);
    reset();
  }, [reset, validateFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const result = await upload(file);
      toast.success('Contrat uploadé avec succès !');
      router.push(`/contracts/${result.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    }
  };

  const clearFile = () => {
    setFile(null);
    reset();
  };

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
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analyser un nouveau contrat</h1>
        <p className="text-slate-600 mt-1">
          Téléchargez votre contrat PDF ou DOCX pour une analyse IA (à titre indicatif)
        </p>
      </div>

      {/* Legal disclaimer + consent (required) */}
      <LegalDisclaimerWithConsent onAccept={() => setHasLegalConsent(true)} />

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de fichier</CardTitle>
          <CardDescription>
            Formats acceptés : PDF ou DOCX (max 10 Mo)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center transition-colors
                ${isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-300 hover:border-slate-400'
                }
              `}
            >
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-900 mb-2">
                Glissez-déposez votre fichier ici
              </p>
              <p className="text-slate-500 mb-4">ou</p>
              <label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button variant="outline" type="button">
                  Parcourir les fichiers
                </Button>
              </label>
            </div>
          ) : (
            <div className="border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <File className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearFile}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-slate-600 text-center">
                    Upload en cours... {progress}%
                  </p>
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}

              {progress === 100 && !error && (
                <Alert className="mt-4 bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Upload terminé ! Redirection en cours...
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || isUploading || !hasLegalConsent}
            className="w-full"
          >
            {isUploading ? (
              'Upload en cours...'
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Lancer l&apos;analyse
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h4 className="font-medium text-blue-900 mb-2">Que se passe-t-il ensuite ?</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              Notre IA analyse votre contrat en quelques minutes
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              Vous recevez une analyse complète avec les risques identifiés
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              Des points d’attention et risques potentiels sont mis en évidence (à valider avec un professionnel)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
