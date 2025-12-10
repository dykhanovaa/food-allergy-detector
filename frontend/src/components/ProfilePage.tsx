// frontend/src/components/ProfilePage.tsx

import { useState, useEffect } from 'react';
import { User } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { User as UserIcon, Upload, LogOut } from 'lucide-react';
import { Badge } from './ui/badge';

type ProfilePageProps = {
  user: User;
  allAllergies: { id: number; name: string }[];
  initialAllergyIds: number[];
  onUpdateAllergies: (allergyIds: number[]) => void;
  onNavigateToUpload: () => void;
  onLogout: () => void;
};

export function ProfilePage({
  user,
  allAllergies,
  initialAllergyIds,
  onUpdateAllergies,
  onNavigateToUpload,
  onLogout,
}: ProfilePageProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>(initialAllergyIds);

  useEffect(() => {
    setSelectedIds(initialAllergyIds);
  }, [initialAllergyIds]);

  const toggleAllergy = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleSave = () => {
    onUpdateAllergies(selectedIds);
  };

  const selectedNames = selectedIds
    .map(id => allAllergies.find(a => a.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            <span>AllergyCheck</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onNavigateToUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Анализ
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
            <h1 className="text-2xl font-bold">Профиль</h1>
            <p className="text-neutral-600 mt-1">
              Управляйте своим списком аллергий
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Информация о пользователе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-neutral-600">Имя:</span> {user.name}
              </div>
              <div>
                <span className="text-neutral-600">Email:</span> {user.email}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Мои аллергии</CardTitle>
              <CardDescription>
                Выберите аллергены, на которые у вас есть реакция
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allAllergies.map((allergen) => (
                  <div key={allergen.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`allergy-${allergen.id}`}
                      checked={selectedIds.includes(allergen.id)}
                      onCheckedChange={() => toggleAllergy(allergen.id)}
                    />
                    <Label htmlFor={`allergy-${allergen.id}`} className="cursor-pointer">
                      {allergen.name}
                    </Label>
                  </div>
                ))}
              </div>

              {selectedNames.length > 0 && (
                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-sm text-neutral-600 mb-2">
                    Выбрано аллергенов: {selectedNames.length}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedNames.map((name) => (
                      <Badge key={name} variant="secondary">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handleSave} className="w-full">
                Сохранить изменения
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}