// frontend/src/components/AdminPage.tsx

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Shield, User as UserIcon, LogOut } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

type User = {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
};

type AdminPageProps = {
  onLogout: () => void;
};

export function AdminPage({ onLogout }: AdminPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  const API_BASE_URL = 'http://localhost:8000/api';

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE_URL}/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        } else {
          setError('Ошибка загрузки пользователей');
        }
      } catch (err) {
        setError('Ошибка сети');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUpdateRole = async () => {
    if (!selectedUserId) return;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/admin/users/${selectedUserId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_role: newRole })
      });

      if (res.ok) {
        // Обновляем список пользователей
        setUsers(users.map(u => 
          u.id === selectedUserId ? { ...u, role: newRole } : u
        ));
        setSelectedUserId(null);
        setNewRole('user');
      } else {
        const data = await res.json();
        setError(data.detail || 'Ошибка обновления роли');
      }
    } catch (err) {
      setError('Ошибка сети');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <span>Админка</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/profile'}>
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
            <h1 className="text-2xl font-bold">Управление пользователями</h1>
            <p className="text-neutral-600 mt-1">
              Назначение ролей и просмотр списка пользователей
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Список пользователей</CardTitle>
              <CardDescription>
                Измените роль пользователя или просмотрите информацию
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Загрузка...</p>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-neutral-600">{user.email}</div>
                        <div className="text-xs mt-1">
                          Роль: <span className={user.role === 'admin' ? 'text-purple-600' : 'text-neutral-500'}>
                            {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                          </span>
                        </div>
                      </div>
                      {user.role !== 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setNewRole(user.role === 'user' ? 'admin' : 'user');
                          }}
                        >
                          Сделать админом
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedUserId && (
            <Card>
              <CardHeader>
                <CardTitle>Изменение роли</CardTitle>
                <CardDescription>
                  Подтвердите изменение роли пользователя
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Новая роль</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
                    className="w-full p-2 border rounded"
                  >
                    <option value="user">Пользователь</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateRole} className="flex-1">
                    Сохранить изменения
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedUserId(null)} className="flex-1">
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}