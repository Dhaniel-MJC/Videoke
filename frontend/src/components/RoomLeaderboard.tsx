/**
 * Componente de Placar da Sala
 * - Ranking dos melhores performances
 * - Comparação com sua pontuação
 * - Prêmios e badges
 */

import { useMemo } from 'react';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  performances: number;
  averageScore: number;
  badges: Badge[];
  isCurrentUser?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface RoomLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
}

export default function RoomLeaderboard({
  entries,
  currentUserId,
}: RoomLeaderboardProps) {
  // Ordenar e rankear participantes
  const rankedEntries = useMemo(() => {
    return entries
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        isCurrentUser: entry.userId === currentUserId,
      }));
  }, [entries, currentUserId]);

  // Encontrar sua posição
  const currentUserRank = rankedEntries.find(
    (e) => e.userId === currentUserId
  );

  // Calculadores de prêmios e badges
  const awardBadges = (entry: LeaderboardEntry, rank: number): Badge[] => {
    const badges: Badge[] = [...entry.badges];

    // 🥇 Ouro
    if (rank === 1) {
      badges.push({
        id: 'gold_medal',
        name: 'Campeão',
        icon: '🥇',
        description: 'Maior pontuação média da sala',
      });
    }

    // 🥈 Prata
    if (rank === 2) {
      badges.push({
        id: 'silver_medal',
        name: 'Vice-Campeão',
        icon: '🥈',
        description: 'Segunda maior pontuação',
      });
    }

    // 🥉 Bronze
    if (rank === 3) {
      badges.push({
        id: 'bronze_medal',
        name: 'Top 3',
        icon: '🥉',
        description: 'Terceira maior pontuação',
      });
    }

    // 🎯 Consistência
    if (entry.performances >= 5 && entry.averageScore >= 75) {
      badges.push({
        id: 'consistency',
        name: 'Consistência',
        icon: '🎯',
        description: 'Mantém alta qualidade em múltiplas apresentações',
      });
    }

    // 🚀 Ascendente
    if (entry.performances >= 3) {
      const recentAverage =
        (entry.score + entry.averageScore) / 2;
      if (recentAverage > entry.averageScore * 1.1) {
        badges.push({
          id: 'rising_star',
          name: 'Estrela em Ascensão',
          icon: '🚀',
          description: 'Melhorando continuamente',
        });
      }
    }

    // ⭐ Estrela
    if (entry.averageScore >= 90) {
      badges.push({
        id: 'star',
        name: 'Estrela do Karaokê',
        icon: '⭐',
        description: 'Pontuação média acima de 90',
      });
    }

    return badges;
  };

  return (
    <div className="space-y-4">
      {/* Seu Ranking */}
      {currentUserRank && (
        <div className="bg-gradient-to-r from-purple-700 to-pink-700 rounded-lg p-4 mb-4">
          <div className="text-white">
            <p className="text-sm opacity-90">Sua Posição</p>
            <div className="flex items-center justify-between mt-2">
              <div>
                <h3 className="text-2xl font-bold">
                  #{currentUserRank.rank}
                </h3>
                <p className="text-sm opacity-75">
                  Pontuação média: {currentUserRank.averageScore.toFixed(1)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl">
                  {currentUserRank.rank === 1 && '🥇'}
                  {currentUserRank.rank === 2 && '🥈'}
                  {currentUserRank.rank === 3 && '🥉'}
                  {currentUserRank.rank > 3 && '🎤'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Ranking */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Cabeçalho */}
            <thead>
              <tr className="bg-gray-700 border-b border-gray-600">
                <th className="px-4 py-3 text-left text-sm font-semibold text-purple-300">
                  Posição
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-purple-300">
                  Cantor
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-purple-300">
                  Apresentações
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-purple-300">
                  Pontuação
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-purple-300">
                  Badges
                </th>
              </tr>
            </thead>

            {/* Corpo */}
            <tbody className="divide-y divide-gray-700">
              {rankedEntries.map((entry) => {
                const badges = awardBadges(entry, entry.rank);
                return (
                  <tr
                    key={entry.userId}
                    className={`${
                      entry.isCurrentUser
                        ? 'bg-purple-900/50 hover:bg-purple-900/70'
                        : 'hover:bg-gray-700/50'
                    } transition`}
                  >
                    {/* Rank */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                        <span className="font-bold text-white">
                          {entry.rank === 1 && '🥇'}
                          {entry.rank === 2 && '🥈'}
                          {entry.rank === 3 && '🥉'}
                          {entry.rank > 3 && entry.rank}
                        </span>
                      </div>
                    </td>

                    {/* Nome do Cantor */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-sm">
                          🎤
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {entry.username}
                          </p>
                          {entry.isCurrentUser && (
                            <p className="text-xs text-purple-300">
                              Você
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Apresentações */}
                    <td className="px-4 py-4 text-center">
                      <span className="text-gray-300 font-medium">
                        {entry.performances}
                      </span>
                    </td>

                    {/* Pontuação */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {entry.averageScore.toFixed(1)}
                        </span>
                        <div className="w-20 h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                            style={{
                              width: `${Math.min(
                                entry.averageScore,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Badges */}
                    <td className="px-4 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {badges.slice(0, 3).map((badge) => (
                          <div
                            key={badge.id}
                            className="group relative"
                            title={badge.description}
                          >
                            <span className="text-lg cursor-help">
                              {badge.icon}
                            </span>
                            {/* Tooltip */}
                            <div className="invisible group-hover:visible absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 border border-purple-500">
                              {badge.name}
                            </div>
                          </div>
                        ))}
                        {badges.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{badges.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estatísticas Gerais da Sala */}
      {rankedEntries.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {rankedEntries.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Cantores Ativos</p>
          </div>

          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {(
                rankedEntries.reduce(
                  (sum, e) => sum + e.averageScore,
                  0
                ) / rankedEntries.length
              ).toFixed(1)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Média da Sala</p>
          </div>

          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {rankedEntries[0]?.averageScore.toFixed(1) || '0'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Melhor Score</p>
          </div>
        </div>
      )}
    </div>
  );
}
