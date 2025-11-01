'use client';

import { useMemo } from 'react';
import type { SnakeScore } from '../spacetime_module_bindings';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

interface LeaderboardProps {
  scores: ReadonlyMap<string, SnakeScore>;
  currentWallet?: string;
}

export function Leaderboard({ scores, currentWallet }: LeaderboardProps) {
  const topScores = useMemo(() => {
    return Array.from(scores.values())
      .sort((a: SnakeScore, b: SnakeScore) => b.score - a.score)
      .slice(0, 10);
  }, [scores]);

  const currentUserScore = currentWallet ? scores.get(currentWallet) : undefined;
  const currentUserRank = currentUserScore
    ? Array.from(scores.values())
        .sort((a: SnakeScore, b: SnakeScore) => b.score - a.score)
        .findIndex((s: SnakeScore) => s.walletAddress === currentWallet) + 1
    : null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">🏆 Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        {topScores.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No scores yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {topScores.map((score: SnakeScore, index: number) => (
              <div
                key={score.walletAddress}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  score.walletAddress === currentWallet
                    ? 'bg-green-100 border-2 border-green-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-lg font-bold w-6 text-center shrink-0">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{score.username}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {score.walletAddress.slice(0, 6)}...{score.walletAddress.slice(-4)}
                    </p>
                  </div>
                </div>
                <span className="text-xl font-bold shrink-0">{score.score}</span>
              </div>
            ))}
          </div>
        )}

        {currentUserScore && currentUserRank && currentUserRank > 10 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2 text-center">Your Rank</p>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-100 border-2 border-green-500">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg font-bold w-6 text-center shrink-0">#{currentUserRank}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{currentUserScore.username}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUserScore.walletAddress.slice(0, 6)}...{currentUserScore.walletAddress.slice(-4)}
                  </p>
                </div>
              </div>
              <span className="text-xl font-bold shrink-0">{currentUserScore.score}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
