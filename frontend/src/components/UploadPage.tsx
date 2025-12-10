import { useState, useRef } from 'react';
import { User } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Upload, User as UserIcon, LogOut, Camera, X } from 'lucide-react';
import { Badge } from './ui/badge';

type UploadPageProps = {
  user: User;
  onAnalyze: (file: File) => void;
  onNavigateToProfile: () => void;
  onLogout: () => void;
};

export function UploadPage({ user, onAnalyze, onNavigateToProfile, onLogout }: UploadPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      onAnalyze(selectedFile);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <span>AllergyCheck</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onNavigateToProfile}>
              <UserIcon className="h-4 w-4 mr-2" />
              Профиль
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1>Анализ этикетки</h1>
            <p className="text-neutral-600 mt-1">
              Загрузите фото этикетки продукта для проверки на аллергены
            </p>
          </div>

          {user.allergies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ваши аллергены</CardTitle>
                <CardDescription>
                  Мы проверим продукт на наличие этих аллергенов
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.allergies.map((allergen) => (
                    <Badge key={allergen} variant="secondary">
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {user.allergies.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-neutral-600">
                <p>
                  У вас пока не указаны аллергены.{' '}
                  <button
                    onClick={onNavigateToProfile}
                    className="text-neutral-900 hover:underline"
                  >
                    Перейти в профиль
                  </button>
                  {' '}для настройки.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Загрузите изображение</CardTitle>
              <CardDescription>
                Сфотографируйте или загрузите фото этикетки продукта
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 rounded-lg p-12 text-center cursor-pointer hover:border-neutral-400 transition-colors"
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <p className="text-neutral-600 mb-2">
                    Нажмите для выбора изображения
                  </p>
                  <p className="text-sm text-neutral-500">
                    PNG, JPG до 10MB
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-contain bg-neutral-100 rounded-lg"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleClearFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Button
                onClick={handleAnalyze}
                disabled={!selectedFile}
                className="w-full"
              >
                Проанализировать этикетку
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
