// frontend/src/api/scans.ts
const API_BASE_URL = 'http://localhost:8000/api';

export const fetchScans = async (filters: Record<string, any>): Promise<any> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const res = await fetch(`${API_BASE_URL}/scans?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Ошибка загрузки сканов');
  return res.json();
};

export const deleteScan = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/scans/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Ошибка удаления скана');
};