import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';

interface LobbyPageProps {
  onJoinRoom: () => void;
  onViewStats?: () => void;
}

export default function LobbyPage({ onJoinRoom, onViewStats }: LobbyPageProps) {
  const { user, logout } = useAuthStore();
  const { rooms, currentRoom, fetchRooms, createRoom, joinRoom, isLoading } = useRoomStore();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const room = await createRoom(newRoomName);
      setNewRoomName('');
      setShowCreateRoom(false);
      await joinRoom(room.id);
      onJoinRoom();
    } catch (error) {
      console.error('Erro ao criar sala:', error);
    }
  };

  const handleJoinRoom = async (roomId: number) => {
    try {
      await joinRoom(roomId);
      onJoinRoom();
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            🎤 Videoke
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Bem-vindo, {user?.username}!</span>
            {onViewStats && (
              <button
                onClick={onViewStats}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition"
              >
                📊 Estatísticas
              </button>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Create Room Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateRoom(!showCreateRoom)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition"
          >
            + Criar Nova Sala
          </button>

          {showCreateRoom && (
            <form onSubmit={handleCreateRoom} className="mt-4 bg-gray-800 rounded-lg p-6">
              <input
                type="text"
                placeholder="Nome da sala"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 mb-4"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-2xl transition"
            >
              <h3 className="text-xl font-bold text-white mb-2">{room.name}</h3>
              <p className="text-gray-400 text-sm mb-4">
                👥 {room.max_participants || 10} pessoas máx
              </p>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">
                  {room.max_participants || 10} participantes
                </span>
                <button
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  Entrar
                </button>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhuma sala disponível</p>
            <p className="text-gray-500 mt-2">Crie uma nova sala para começar!</p>
          </div>
        )}
      </div>
    </div>
  );
}
