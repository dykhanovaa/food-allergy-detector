// frontend/src/components/LandingPage.tsx

import { SeoMeta } from './SeoMeta';

type LandingPageProps = {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onNavigateToBarcodeLookup: () => void;
};

export const LandingPage = ({ onNavigateToLogin, onNavigateToRegister, onNavigateToBarcodeLookup }: LandingPageProps) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Food Allergy Detector",
    "description": "Приложение для анализа этикеток продуктов на аллергены",
    "url": "http://localhost:5173/",
    "applicationCategory": "HealthApplication"
  };

  return (
    <>
      <SeoMeta 
        title="Food Allergy Detector — Проверка продуктов на аллергены"
        description="Бесплатное приложение для анализа этикеток продуктов. Сканируйте упаковку — мы мгновенно проверим состав на наличие ваших аллергенов."
        canonical="http://localhost:5173/"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4 py-8">
        {/* Центральный блок */}
        <div className="text-center max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Food Allergy Detector</h1>
          <p className="text-gray-600 mb-8">
            Анализ этикеток продуктов на аллергены — быстро и безопасно.
          </p>

          <div className="space-y-4">
            <button
              onClick={onNavigateToLogin}
              className="w-full py-3 px-4 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Войти
            </button>
            <button
              onClick={onNavigateToRegister}
              className="w-full py-3 px-4 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Создать аккаунт
            </button>
          </div>
        </div>

        <div className="mt-6">
            <button
                onClick={onNavigateToBarcodeLookup}
                className="text-blue-600 hover:underline text-sm"
            >
            Или получите информацию о продукте по штрихкоду →
            </button>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Food Allergy Detector
        </footer>
      </div>
    </>
  );
};