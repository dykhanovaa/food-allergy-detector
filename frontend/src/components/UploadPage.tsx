// frontend/src/components/UploadPage.tsx

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Upload } from 'lucide-react';

type UploadPageProps = {
  user: any;
  onAnalyze: (imageFile: File) => void;
  onNavigateToProfile: () => void;
  onLogout: () => void;
};

export function UploadPage({ user, onAnalyze, onNavigateToProfile, onLogout }: UploadPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onAnalyze(selectedFile);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            <span>AllergyCheck</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onNavigateToProfile}>
              Профиль
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Анализ этикетки</CardTitle>
            <CardDescription>
              Загрузите фото этикетки продукта, чтобы проверить его на наличие аллергенов
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-2 border rounded"
              />
              {previewUrl && (
                <div className="mt-4">
                  <img src={previewUrl} alt="Preview" className="max-w-full h-auto rounded" />
                </div>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="w-full"
            >
              Начать анализ
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}