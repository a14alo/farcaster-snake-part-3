'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { SnakeGame } from '@/components/snake-game';
import { Leaderboard } from '@/components/leaderboard';
import { useSpacetimeLeaderboard } from '@/hooks/use-spacetime-leaderboard';
import { useTransactionScore } from '@/hooks/use-transaction-score';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAddMiniApp } from "@/hooks/useAddMiniApp";

export default function Home() {
  const { address, status } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { connected: dbConnected, scores, saveScore } = useSpacetimeLeaderboard();
  const { saveScoreWithTransaction, isLoading: isSavingScore, isSuccess: scoreSaved, transactionHash } = useTransactionScore();
  const [farcasterUsername, setFarcasterUsername] = useState<string | null>(null);
  const [isFarcasterConnected, setIsFarcasterConnected] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const { addMiniApp } = useAddMiniApp();
  
  useEffect(() => {
    const tryAddMiniApp = async () => {
      try {
        await addMiniApp()
      } catch (error) {
        console.error('Failed to add mini app:', error)
      }
    }

    tryAddMiniApp()
  }, [addMiniApp])

  // Load Farcaster context
  useEffect(() => {
    let cancelled = false;

    async function loadFarcasterContext() {
      try {
        await sdk.actions.ready();
        const context = await sdk.context;
        if (!cancelled) {
          const username = context?.user?.username ?? null;
          setFarcasterUsername(username);
          setIsFarcasterConnected(!!username);
        }
      } catch (error) {
        if (!cancelled) {
          setFarcasterUsername(null);
          setIsFarcasterConnected(false);
        }
      }
    }

    loadFarcasterContext();
    return () => {
      cancelled = true;
    };
  }, []);

  // Save score after successful transaction
  useEffect(() => {
    if (scoreSaved && pendingScore && address && transactionHash) {
      const username = farcasterUsername || `${address.slice(0, 6)}...${address.slice(-4)}`;
      saveScore(address, username, pendingScore);
      setPendingScore(null);
      setHasPlayed(true);
      
      // Share score on Farcaster
      if (farcasterUsername) {
        shareScore(pendingScore);
      }
    }
  }, [scoreSaved, pendingScore, address, farcasterUsername, transactionHash, saveScore]);

  const handleConnectWallet = async () => {
    try {
      const farcasterConnector = connectors.find(c => c.id === 'farcaster');
      if (farcasterConnector) {
        await connect({ connector: farcasterConnector });
      } else {
        console.error('Farcaster wallet not found. Please open this app in Warpcast.');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnectWallet = () => {
    disconnect();
  };

  const handleGameOver = useCallback((score: number) => {
    if (score > 0) {
      setPendingScore(score);
    }
  }, []);

  const handleSaveScore = async () => {
    if (!pendingScore || !address) return;
    
    try {
      const username = farcasterUsername || `${address.slice(0, 6)}...${address.slice(-4)}`;
      
      // Check if this is a new high score
      const currentHighScore = scores.get(address);
      if (!currentHighScore || pendingScore > currentHighScore.score) {
        await saveScoreWithTransaction(pendingScore, username);
      } else {
        setPendingScore(null);
      }
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  };

  const shareScore = async (score: number) => {
    try {
      const text = `🐍 I scored ${score} points in the Snake Game! Can you beat my score?`;
      const embedUrl = typeof window !== 'undefined' ? window.location.origin : '';
      
      await sdk.actions.composeCast({
        text,
        embeds: [embedUrl],
      });
    } catch (error) {
      console.log('Cast share skipped:', error);
    }
  };

  const handleStartGame = () => {
    setShowGame(true);
    setHasPlayed(false);
  };

  const isWalletConnected = status === 'connected' && address;
  const canSaveScore = isWalletConnected && isFarcasterConnected && pendingScore && !isSavingScore;

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-green-800">🐍 Snake Game</h1>
          <p className="text-lg text-green-700">Classic arcade fun on Base blockchain</p>
          
          {/* Connection Status */}
          <div className="flex flex-col items-center gap-3">
            {!isWalletConnected ? (
              <Button
                onClick={handleConnectWallet}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
              >
                Connect Farcaster Wallet
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-sm bg-green-100 px-4 py-2 rounded-full">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  <span className="font-medium">Wallet Connected:</span>
                  <span className="text-green-700">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
                <Button
                  onClick={handleDisconnectWallet}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  Disconnect
                </Button>
              </div>
            )}
            
            {isFarcasterConnected ? (
              <div className="flex items-center gap-2 text-sm bg-purple-100 px-4 py-2 rounded-full">
                <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                <span className="font-medium">Farcaster:</span>
                <span className="text-purple-700">@{farcasterUsername}</span>
              </div>
            ) : (
              <Card className="bg-purple-50 border-purple-200 max-w-md">
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm text-purple-800 text-center">
                    Open in Warpcast to connect your Farcaster account
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Score Saving Status */}
        {pendingScore && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div>
                  <p className="text-yellow-800 font-bold text-xl">
                    Score: {pendingScore} points
                  </p>
                  {!isWalletConnected && (
                    <p className="text-sm text-yellow-700 mt-2">
                      Connect your Farcaster wallet to save this score
                    </p>
                  )}
                  {!isFarcasterConnected && isWalletConnected && (
                    <p className="text-sm text-yellow-700 mt-2">
                      Open in Warpcast to save your score
                    </p>
                  )}
                </div>
                {canSaveScore && (
                  <Button
                    onClick={handleSaveScore}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Save Score (Gas Only - FREE)
                  </Button>
                )}
                {isSavingScore && (
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-700"></div>
                    <span>Processing transaction...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Database Status */}
        {!dbConnected && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-center text-blue-800">
                Connecting to leaderboard database...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Game Section */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                {!showGame ? (
                  <div className="text-center space-y-6 py-8">
                    <div className="text-6xl">🐍</div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">Ready to Play?</h2>
                      <p className="text-gray-600">
                        Guide the snake to eat food and grow longer!
                      </p>
                    </div>
                    <Button
                      onClick={handleStartGame}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-xl"
                    >
                      Start Game
                    </Button>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>🎮 Desktop: Arrow Keys or WASD</p>
                      <p>📱 Mobile: Use control buttons</p>
                    </div>
                  </div>
                ) : (
                  <SnakeGame onGameOver={handleGameOver} />
                )}
              </CardContent>
            </Card>

            {/* Game Info */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6 space-y-3 text-sm">
                <div className="space-y-1">
                  <h3 className="font-semibold text-green-800">How to Play:</h3>
                  <ul className="list-disc list-inside text-green-700 space-y-1">
                    <li>Eat the red food to grow</li>
                    <li>Avoid hitting walls or yourself</li>
                    <li>Each food gives you 10 points</li>
                    <li>Connect Farcaster wallet to save scores</li>
                  </ul>
                </div>
                {hasPlayed && (
                  <div className="pt-2 border-t border-green-300">
                    <p className="text-green-800">
                      ✅ Your score has been saved to the leaderboard!
                    </p>
                    {transactionHash && (
                      <a
                        href={`https://basescan.org/tx/${transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 block"
                      >
                        View transaction
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard Section */}
          <div className="space-y-4">
            <Leaderboard scores={scores} currentWallet={address} />

            {/* Share Section */}
            {farcasterUsername && isWalletConnected && (
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-6 text-center space-y-3">
                  <p className="text-purple-800 font-medium">
                    Playing on Farcaster! 🎉
                  </p>
                  <p className="text-sm text-purple-700">
                    Your high scores will be automatically shared when you beat them!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 pt-8 border-t">
          <p>Built on Base • Powered by Farcaster & SpacetimeDB</p>
        </div>
      </div>
    </main>
  );
}
