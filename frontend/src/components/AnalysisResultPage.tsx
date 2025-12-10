import { User, AnalysisResult } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Camera, User as UserIcon, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type AnalysisResultPageProps = {
  result: AnalysisResult;
  user: User;
  onNavigateToUpload: () => void;
  onNavigateToProfile: () => void;
  onLogout: () => void;
};

export function AnalysisResultPage({ 
  result, 
  user, 
  onNavigateToUpload, 
  onNavigateToProfile, 
  onLogout 
}: AnalysisResultPageProps) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1>Результат анализа</h1>
              <p className="text-neutral-600 mt-1">
                {result.productName}
              </p>
            </div>
          </div>

          {result.warnings.length > 0 ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Внимание!</AlertTitle>
              <AlertDescription>
                {result.warnings.map((warning, index) => (
                  <div key={index}>{warning}</div>
                ))}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Безопасно</AlertTitle>
              <AlertDescription>
                Продукт не содержит ваших аллергенов
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Обнаруженные аллергены</CardTitle>
              <CardDescription>
                Аллергены, найденные в составе продукта
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.detectedAllergens.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.detectedAllergens.map((allergen) => {
                    const isUserAllergen = user.allergies.includes(allergen);
                    return (
                      <Badge
                        key={allergen}
                        variant={isUserAllergen ? "destructive" : "secondary"}
                      >
                        {allergen}
                        {isUserAllergen && ' ⚠️'}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-neutral-600">
                  Аллергены не обнаружены
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Состав продукта</CardTitle>
              <CardDescription>
                Полный список ингредиентов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                  >
                    <span>{ingredient}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={onNavigateToUpload} className="flex-1">
              Проверить другой продукт
            </Button>
            <Button
              onClick={onNavigateToProfile}
              variant="outline"
              className="flex-1"
            >
              Настроить аллергии
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
