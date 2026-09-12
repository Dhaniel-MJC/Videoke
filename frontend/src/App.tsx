import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import RoomPage from './pages/RoomPage';
import StatsPage from './pages/StatsPage';

type Page = 'login' | 'lobby' | 'room' | 'stats';

function App() {
  const { user, checkAuth } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<Page>('login');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      setCurrentPage('lobby');
    } else {
      setCurrentPage('login');
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'lobby' && (
        <LobbyPage
          onJoinRoom={() => setCurrentPage('room')}
          onViewStats={() => setCurrentPage('stats')}
        />
      )}
      {currentPage === 'room' && <RoomPage onLeaveRoom={() => setCurrentPage('lobby')} />}
      {currentPage === 'stats' && (
        <div>
          <StatsPage />
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <button
              onClick={() => setCurrentPage('lobby')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              ← Voltar ao Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
