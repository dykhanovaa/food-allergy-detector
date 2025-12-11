// frontend/src/App.tsx

import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ProfilePage } from './components/ProfilePage';
import { UploadPage } from './components/UploadPage';
import { AnalysisResultPage } from './components/AnalysisResultPage';

export type User = {
  id: string;
  email: string;
  name: string;
  allergies: string[];
};

export type AnalysisResult = {
  productName: string;
  ingredients: string[];
  detectedAllergens: string[];
  isSafe: boolean;
  warnings: string[];
};

const API_BASE_URL = 'http://localhost:8000/api';

function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'profile' | 'upload' | 'analysis'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allAllergies, setAllAllergies] = useState<{ id: number; name: string }[]>([]);
  const [selectedAllergyIds, setSelectedAllergyIds] = useState<number[]>([]);

  // Загружаем список всех аллергий + профиль при старте
  useEffect(() => {
    const loadAllergiesAndProfile = async () => {
      try {
        const allergiesRes = await fetch(`${API_BASE_URL}/users/allergies/list`);
        if (!allergiesRes.ok) return;
        const allergies = await allergiesRes.json();
        setAllAllergies(allergies);

        const token = localStorage.getItem('access_token');
        if (token) {
          await fetchProfileWithAllergies(token, allergies);
        }
      } catch (err) {
        console.error('Ошибка загрузки аллергий или профиля', err);
      }
    };

    loadAllergiesAndProfile();
  }, []);

  const fetchProfileWithAllergies = async (token: string, allergyList: { id: number; name: string }[]) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const ids = allergyList
          .filter(a => data.allergies.includes(a.name))
          .map(a => a.id);

        setCurrentUser({
          id: '1',
          email: data.email,
          name: data.name,
          allergies: data.allergies || []
        });
        setSelectedAllergyIds(ids);
        setCurrentPage('profile');
      } else {
        localStorage.removeItem('access_token');
      }
    } catch (err) {
      console.error(err);
      localStorage.removeItem('access_token');
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('access_token', data.access_token);
        const allergiesRes = await fetch(`${API_BASE_URL}/users/allergies/list`);
        const allergies = await allergiesRes.json();
        await fetchProfileWithAllergies(data.access_token, allergies);
      } else {
        setError(data.detail || 'Ошибка входа');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      if (res.ok) {
        await handleLogin(email, password);
      } else {
        const data = await res.json();
        setError(data.detail || 'Ошибка регистрации');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setCurrentUser(null);
    setCurrentPage('login');
  };

  const handleUpdateAllergies = async (allergyIds: number[]) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/users/allergies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ allergy_ids: allergyIds })
      });

      if (res.ok) {
        const allergiesRes = await fetch(`${API_BASE_URL}/users/allergies/list`);
        const allergies = await allergiesRes.json();
        await fetchProfileWithAllergies(token, allergies);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (imageFile: File) => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', imageFile);

    const res = await fetch('http://localhost:8000/api/scans/analyze', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      // 🔁 Преобразуем snake_case → camelCase
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
      setError(data.detail || 'Ошибка анализа');
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
    </>
  );
}

export default App;