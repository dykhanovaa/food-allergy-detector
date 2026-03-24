// frontend/src/App.tsx

import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ProfilePage } from './components/ProfilePage';
import { UploadPage } from './components/UploadPage';
import { AnalysisResultPage } from './components/AnalysisResultPage';
import { AdminPage } from './components/AdminPage';

export type User = {
  id: string;
  email: string;
  name: string;
  allergies: string[];
  role: 'user' | 'admin';
};

export type AnalysisResult = {
  productName: string;
  ingredients: string[];
  detectedAllergens: string[];
  isSafe: boolean;
  warnings: string[];
};

const API_BASE_URL = 'http://localhost:8000/api';

const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  return fetch(url, {
    ...options,
    credentials: 'include',
  });
};

function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'profile' | 'upload' | 'analysis' | 'admin'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allAllergies, setAllAllergies] = useState<{ id: number; name: string }[]>([]);
  const [selectedAllergyIds, setSelectedAllergyIds] = useState<number[]>([]);

  useEffect(() => {
    const loadAllergiesAndProfile = async () => {
      try {
        const allergiesRes = await apiFetch(`${API_BASE_URL}/users/allergies/list`);
        if (!allergiesRes.ok) return;
        const allergies = await allergiesRes.json();
        setAllAllergies(allergies);

        // Пытаемся загрузить профиль — бэкенд сам проверит cookies
        await fetchProfileWithAllergies(allergies);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setCurrentUser(null);
        setCurrentPage('login');
      }
    };

    loadAllergiesAndProfile();
  }, []);

  const fetchProfileWithAllergies = async (allergyList: { id: number; name: string }[]) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/users/profile`);
      if (res.ok) {
        const data = await res.json();
        const ids = allergyList
          .filter(a => data.allergies.includes(a.name))
          .map(a => a.id);

        const userRole = data.role || 'user';

        setCurrentUser({
          id: '1',
          email: data.email,
          name: data.name,
          allergies: data.allergies || [],
          role: userRole 
        });
        setSelectedAllergyIds(ids);
        setCurrentPage('profile');
      } else {
        // Если 401 — перенаправляем на логин
        if (res.status === 401) {
          setCurrentUser(null);
          setCurrentPage('login');
        }
      }
    } catch (err) {
      console.error(err);
      setCurrentUser(null);
      setCurrentPage('login');
    }
  };

  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        // Куки установлены автоматически — просто загружаем профиль
        const allergiesRes = await apiFetch(`${API_BASE_URL}/users/allergies/list`);
        const allergies = await allergiesRes.json();
        await fetchProfileWithAllergies(allergies);
        return null;
      } else {
        const data = await res.json();
        return data.detail || 'Ошибка входа';
      }
    } catch (err) {
      return 'Ошибка сети. Проверьте подключение.';
    }
  };

  const handleRegister = async (email: string, password: string, name: string): Promise<string | null> => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      if (res.ok) {
        await handleLogin(email, password);
        return null;
      } else {
        const data = await res.json();
        return data.detail || 'Ошибка регистрации';
      }
    } catch (err) {
      return 'Ошибка сети. Проверьте подключение.';
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    } catch (err) {
      console.error('Ошибка при выходе:', err);
    } finally {
      setCurrentUser(null);
      setCurrentPage('login');
    }
  };

  const handleUpdateAllergies = async (allergyIds: number[]) => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/users/allergies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allergy_ids: allergyIds })
      });

      if (res.ok) {
        const allergiesRes = await apiFetch(`${API_BASE_URL}/users/allergies/list`);
        const allergies = await allergiesRes.json();
        await fetchProfileWithAllergies(allergies);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (imageFile: File) => {
    const formData = new FormData();
    formData.append('file', imageFile);

    const res = await apiFetch(`${API_BASE_URL}/scans/analyze`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      const normalizedResult: AnalysisResult = {
        productName: data.product_name || "Не определено",
        ingredients: data.ingredients || [],
        detectedAllergens: data.detected_allergens || [],
        isSafe: data.is_safe ?? true,
        warnings: data.warnings || []
      };
      setAnalysisResult(normalizedResult);
      setCurrentPage('analysis');
    } else {
      if (res.status === 401) {
        setCurrentUser(null);
        setCurrentPage('login');
      } else {
        setError(data.detail || 'Ошибка анализа');
      }
    }
  };

  if (!currentUser) {
    return (
      <>
        {currentPage === 'login' && (
          <LoginPage
            onLogin={handleLogin}
            onNavigateToRegister={() => setCurrentPage('register')}
          />
        )}
        {currentPage === 'register' && (
          <RegisterPage
            onRegister={handleRegister}
            onNavigateToLogin={() => setCurrentPage('login')}
          />
        )}
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded">
            {error}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {currentPage === 'upload' && (
        <UploadPage
          user={currentUser}
          onAnalyze={handleAnalyze}
          onNavigateToProfile={() => setCurrentPage('profile')}
          onLogout={handleLogout}
        />
      )}
      {currentPage === 'profile' && allAllergies.length > 0 && (
        <ProfilePage
          user={currentUser}
          allAllergies={allAllergies}
          initialAllergyIds={selectedAllergyIds}
          onUpdateAllergies={handleUpdateAllergies}
          onNavigateToUpload={() => setCurrentPage('upload')}
          onNavigateToAdmin={() => setCurrentPage('admin')} 
          onLogout={handleLogout}
        />
      )}
      {currentPage === 'analysis' && analysisResult && (
        <AnalysisResultPage
          result={analysisResult}
          user={currentUser}
          onNavigateToUpload={() => setCurrentPage('upload')}
          onNavigateToProfile={() => setCurrentPage('profile')}
          onLogout={handleLogout}
        />
      )}
      {currentPage === 'admin' && currentUser.role === 'admin' && (
        <AdminPage onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;