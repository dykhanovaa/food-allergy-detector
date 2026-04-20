// frontend/src/App.tsx

import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ProfilePage } from './components/ProfilePage';
import { UploadPage } from './components/UploadPage';
import { AnalysisResultPage } from './components/AnalysisResultPage';
import { AdminPage } from './components/AdminPage';
import { ScanList } from './components/ScanList';
import { LandingPage } from './components/LandingPage';
import { BarcodeLookupPage } from './components/BarcodeLookupPage.tsx';

export type User = {
  id: string;
  email: string;
  name: string;
  allergies: string[];
  role: 'user' | 'admin';
};

export type Allergy = {
  id: number;
  name: string;
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
  // Добавили 'landing' в список состояний
  const [currentPage, setCurrentPage] = useState<
  'landing' | 'login' | 'register' | 'profile' | 'upload' | 'analysis' | 'admin' | 'scans' | 'barcode-lookup'
  >('landing');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allAllergies, setAllAllergies] = useState<{ id: number; name: string }[]>([]);
  const [selectedAllergyIds, setSelectedAllergyIds] = useState<number[]>([]);

  // Загрузка профиля при монтировании
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/users/profile`);
        if (res.ok) {
          const data = await res.json();
          const allergiesRes = await apiFetch(`${API_BASE_URL}/users/allergies/list`);
          const allergies: Allergy[] = await allergiesRes.json();
          const ids = allergies
            .filter(a => data.allergies.includes(a.name))
            .map(a => a.id);
          setCurrentUser({
            id: '1',
            email: data.email,
            name: data.name,
            allergies: data.allergies || [],
            role: data.role || 'user'
          });
          setAllAllergies(allergies);
          setSelectedAllergyIds(ids);
          setCurrentPage('profile');
        } else {
          // Если нет авторизации — остаёмся на лендинге
          setCurrentPage('landing');
        }
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
        setCurrentPage('landing');
      }
    };
    loadProfile();
  }, []);

  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
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

  const fetchProfileWithAllergies = async (allergyList: { id: number; name: string }[]) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/users/profile`);
      if (res.ok) {
        const data = await res.json();
        const ids = allergyList
          .filter(a => data.allergies.includes(a.name))
          .map(a => a.id);
        setCurrentUser({
          id: '1',
          email: data.email,
          name: data.name,
          allergies: data.allergies || [],
          role: data.role || 'user'
        });
        setAllAllergies(allergyList);
        setSelectedAllergyIds(ids);
        setCurrentPage('profile');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    } catch (err) {
      console.error('Ошибка при выходе:', err);
    } finally {
      setCurrentUser(null);
      setCurrentPage('landing'); 
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
        setCurrentPage('landing');
      } else {
        setError(data.detail || 'Ошибка анализа');
      }
    }
  };

  // Отображение текущей страницы
  return (
    <>
      {currentPage === 'landing' && (
        <LandingPage 
          onNavigateToLogin={() => setCurrentPage('login')}
          onNavigateToRegister={() => setCurrentPage('register')}
          onNavigateToBarcodeLookup={() => setCurrentPage('barcode-lookup')}
        />
      )}

      {currentPage === 'barcode-lookup' && (
        <BarcodeLookupPage 
          onNavigateToLanding={() => setCurrentPage('landing')} 
        />
      )}
      
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
          onNavigateToProfile={() => setCurrentPage('profile')}
        />
      )}
      
      {currentPage === 'upload' && currentUser && (
        <UploadPage
          user={currentUser}
          onAnalyze={handleAnalyze}
          onNavigateToProfile={() => setCurrentPage('profile')}
          onLogout={handleLogout}
        />
      )}
      
      {currentPage === 'profile' && currentUser && allAllergies.length > 0 && (
        <ProfilePage
          user={currentUser}
          allAllergies={allAllergies}
          initialAllergyIds={selectedAllergyIds}
          onUpdateAllergies={handleUpdateAllergies}
          onNavigateToUpload={() => setCurrentPage('upload')}
          onNavigateToAdmin={() => setCurrentPage('admin')}
          onNavigateToScans={() => setCurrentPage('scans')} 
          onLogout={handleLogout}
        />
      )}
      
      {currentPage === 'analysis' && analysisResult && currentUser && (
        <AnalysisResultPage
          result={analysisResult}
          user={currentUser}
          onNavigateToUpload={() => setCurrentPage('upload')}
          onNavigateToProfile={() => setCurrentPage('profile')}
          onLogout={handleLogout}
        />
      )}
      
      {currentPage === 'admin' && currentUser?.role === 'admin' && (
        <AdminPage onLogout={handleLogout} />
      )}
      
      {currentPage === 'scans' && currentUser && (
        <ScanList
          onLogout={handleLogout}
          onNavigateToProfile={() => setCurrentPage('profile')}
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

export default App;
