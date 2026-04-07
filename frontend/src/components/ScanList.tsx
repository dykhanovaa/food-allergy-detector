// frontend/src/components/ScanList.tsx

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scan } from '../types/index';
import { fetchScans, deleteScan } from '../api/scans';

export type ScanFilters = {
  page: number;
  size: number;
  search?: string;
  is_safe?: boolean;
  sort_by: string;
  order: 'asc' | 'desc';
};

const DEFAULT_FILTERS: ScanFilters = {
  page: 1,
  size: 10,
  sort_by: 'created_at',
  order: 'desc',
};

export const ScanList = ({
  onLogout,
  onNavigateToProfile,
}: {
  onLogout: () => void;
  onNavigateToProfile: () => void;
}) => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ScanFilters>(DEFAULT_FILTERS);

  const navigate = useNavigate();
  const location = useLocation();

  //парсим query params при монтировании
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const parsedFilters: ScanFilters = {
      page: parseInt(urlParams.get('page') || '1', 10) || 1,
      size: parseInt(urlParams.get('size') || '10', 10) || 10,
      search: urlParams.get('search') || undefined,
      is_safe: urlParams.get('is_safe') === 'true' ? true : urlParams.get('is_safe') === 'false' ? false : undefined,
      sort_by: urlParams.get('sort_by') || 'created_at',
      order: (urlParams.get('order') as 'asc' | 'desc') || 'desc',
    };
    setFilters(parsedFilters);
  }, [location.search]);

  //загружаем сканы при изменении фильтров
  useEffect(() => {
    const loadScans = async () => {
      setLoading(true);
      setError(null);
      try {
        const searchParams = new URLSearchParams();
        if (filters.page > 1) searchParams.set('page', filters.page.toString());
        if (filters.size !== 10) searchParams.set('size', filters.size.toString());
        if (filters.search) searchParams.set('search', filters.search);
        if (filters.is_safe !== undefined) searchParams.set('is_safe', String(filters.is_safe));
        if (filters.sort_by !== 'created_at') searchParams.set('sort_by', filters.sort_by);
        if (filters.order !== 'desc') searchParams.set('order', filters.order);

        navigate(`?${searchParams.toString()}`, { replace: true });

        const response = await fetchScans(filters);
        setScans(response.items);
        setTotal(response.total);
        setPages(response.pages);
      } catch (err) {
        setError('Не удалось загрузить сканы');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadScans();
  }, [filters, navigate]);

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот скан? Это действие нельзя отменить.')) return;
    try {
      await deleteScan(id);
      setScans(scans.filter(s => s.id !== id));
    } catch (err) {
      setError('Ошибка при удалении');
    }
  };

  const handleFilterChange = (newFilters: Partial<ScanFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const parseIngredients = (ingredients: string | string[]): string[] => {
    if (Array.isArray(ingredients)) {
      return ingredients;
    }
    if (typeof ingredients === 'string') {
      return ingredients.split(',').map(i => i.trim()).filter(i => i.length > 0);
    }
    return [];
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Мои сканы</h1>
        <button
          onClick={onNavigateToProfile}
          className="text-blue-600 hover:underline"
        >
          ← Назад к профилю
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Форма фильтров */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Поиск</label>
            <input
              type="text"
              placeholder="Название или ингредиенты"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Безопасность</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.is_safe === undefined ? '' : filters.is_safe ? 'safe' : 'unsafe'}
              onChange={(e) => {
                if (e.target.value === '') {
                  handleFilterChange({ is_safe: undefined });
                } else {
                  handleFilterChange({ is_safe: e.target.value === 'safe' });
                }
              }}
            >
              <option value="">Все</option>
              <option value="safe">Только безопасные</option>
              <option value="unsafe">С аллергенами</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Сортировка</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.sort_by}
              onChange={(e) => handleFilterChange({ sort_by: e.target.value })}
            >
              <option value="created_at">Дата</option>
              <option value="product_name">Название продукта</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Порядок</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.order}
              onChange={(e) => handleFilterChange({ order: e.target.value as 'asc' | 'desc' })}
            >
              <option value="desc">Сначала новые</option>
              <option value="asc">Сначала старые</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список сканов */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Загрузка...</p>
        </div>
      ) : scans.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">Нет сканов. Загрузите изображение этикетки для анализа.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scans.map((scan) => {
            const ingredients = parseIngredients(scan.ingredients);
            const detectedAllergens = Array.isArray(scan.detected_allergens) 
              ? scan.detected_allergens 
              : [];

            return (
              <div key={scan.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Изображение */}
                  {scan.image_url ? (
                    <div className="flex-shrink-0">
                      <img
                        src={scan.image_url}
                        alt="Этикетка"
                        loading='lazy'
                        className="w-20 h-20 object-cover rounded border border-gray-200"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  ) : null}

                  {/* Основное содержимое */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg truncate">
                      {scan.product_name || 'Не определено'}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Состав:</span> {ingredients.join(', ') || 'Не указан'}
                    </p>
                    
                    {detectedAllergens.length > 0 ? (
                      <p className="text-red-600 mt-2 text-sm">
                        ⚠️ <span className="font-medium">Найдены аллергены:</span> {detectedAllergens.join(', ')}
                      </p>
                    ) : (
                      <p className="text-green-600 mt-2 text-sm">✅ Безопасно</p>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-3">
                      {new Date(scan.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>

                  {/* Кнопка удаления */}
                  <div className="flex-shrink-0 self-start">
                    <button
                      onClick={() => handleDelete(scan.id)}
                      className="text-red-600 hover:text-red-800 text-sm whitespace-nowrap px-3 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Пагинация */}
      {pages > 1 && (
        <div className="flex justify-center mt-8 space-x-1">
          {Array.from({ length: pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1.5 text-sm rounded-md ${
                page === filters.page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <button
          onClick={onLogout}
          className="text-red-600 hover:text-red-800 font-medium hover:underline"
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
};