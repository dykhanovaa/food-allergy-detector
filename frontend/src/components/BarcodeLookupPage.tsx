// frontend/src/components/BarcodeLookupPage.tsx

import { useState, useRef } from 'react';
import { SeoMeta } from './SeoMeta';

<SeoMeta 
  title="Поиск продукта по штрихкоду | Food Allergy Detector"
  description="Загрузите фото этикетки — мы найдём информацию о продукте в международной базе Open Food Facts."
  canonical="http://localhost:5173/barcode-lookup"
/>

type ProductInfo = {
  name: string;
  brands: string;
  categories: string;
  nutriments: Record<string, any>;
  image_url: string;
};

type BarcodeLookupPageProps = {
  onNavigateToLanding: () => void;
};

export const BarcodeLookupPage = ({ onNavigateToLanding }: BarcodeLookupPageProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError(null);
    setProduct(null);

    try {
      const res = await fetch('http://localhost:8000/api/scans/barcode-lookup', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProduct(data);
      } else {
        const err = await res.json();
        setError(err.detail || 'Не удалось найти продукт');
      }
    } catch (err) {
      setError('Ошибка сети. Проверьте подключение.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Поиск по штрихкоду</h1>
        <button
          onClick={onNavigateToLanding}
          className="text-blue-600 hover:underline"
        >
          ← Назад
        </button>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <p className="mb-4 text-gray-700">
          Загрузите фото этикетки со штрихкодом. Мы распознаем код и покажем информацию из базы Open Food Facts.
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="mb-4 w-full"
        />

        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className={`w-full py-2 px-4 rounded ${
            !file || loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Обработка...' : 'Найти продукт'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {product && (
          <div className="mt-6 p-4 border border-gray-200 rounded bg-blue-50">
            <h2 className="font-semibold text-lg mb-2">{product.name || 'Без названия'}</h2>
            
            {product.image_url && (
              <img
                src={product.image_url}
                alt="Продукт"
                className="w-24 h-24 object-contain my-2"
                loading="lazy"
              />
            )}

            {product.brands && <p><span className="font-medium">Бренд:</span> {product.brands}</p>}
            {product.categories && <p><span className="font-medium">Категория:</span> {product.categories}</p>}

            {product.nutriments && (
              <div className="mt-2">
                <p className="font-medium">Пищевая ценность (на 100г):</p>
                <ul className="list-disc list-inside text-sm">
                  {product.nutriments.energy_100g && (
                    <li>Энергия: {product.nutriments.energy_100g} кДж</li>
                  )}
                  {product.nutriments.proteins_100g && (
                    <li>Белки: {product.nutriments.proteins_100g} г</li>
                  )}
                  {product.nutriments.carbohydrates_100g && (
                    <li>Углеводы: {product.nutriments.carbohydrates_100g} г</li>
                  )}
                  {product.nutriments.fat_100g && (
                    <li>Жиры: {product.nutriments.fat_100g} г</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};