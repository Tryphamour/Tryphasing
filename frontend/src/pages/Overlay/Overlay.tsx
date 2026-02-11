import React, { useEffect, useState, useRef, useCallback } from 'react';
import { socket } from '../../services/socket'; // Socket.IO client
import { FrontendPackOpeningResult, Rarity } from '../../services/api'; // Import from local api.ts

type AnimationStage = 'idle' | 'pack-open' | 'card-reveal' | 'stats-display' | 'complete';

export const Overlay: React.FC = () => {
  const [packOpeningData, setPackOpeningData] = useState<FrontendPackOpeningResult | null>(null);
  const [animationStage, setAnimationStage] = useState<AnimationStage>('idle');
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout[]>([]);

  // Clear all timeouts on unmount or before new animation starts
  const clearAllTimeouts = useCallback(() => {
    animationTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    animationTimeoutRef.current = [];
  }, []);

  useEffect(() => {
    // Listen for pack opening start event from backend
    socket.on('packOpeningStarted', (data: FrontendPackOpeningResult) => {
      console.log('Pack opening started:', data);
      clearAllTimeouts(); // Clear any previous pending animations
      setPackOpeningData(data);
      setShowOverlay(true);
      setAnimationStage('pack-open');

      // --- Animation Sequence ---
      // Step 1: Pack opening animation
      animationTimeoutRef.current.push(setTimeout(() => {
        setAnimationStage('card-reveal');
      }, 2000)); // Pack opens for 2 seconds

      // Step 2: Card reveal (zoom artwork + name)
      animationTimeoutRef.current.push(setTimeout(() => {
        setAnimationStage('stats-display');
      }, 5000)); // Card revealed for 3 seconds (2s initial + 3s reveal)

      // Step 3: Stats display
      animationTimeoutRef.current.push(setTimeout(() => {
        setAnimationStage('complete'); // Animation sequence ends
        setShowOverlay(false); // Hide overlay
        socket.emit('animationComplete', data.requestId, data); // Signal backend that animation is done
        setPackOpeningData(null); // Clear data
      }, 8000)); // Stats display for 3 seconds (5s + 3s stats)
    });

    socket.on('packOpeningError', (data: { requestId: string; error: string }) => {
      console.error('Pack opening error:', data.error);
      clearAllTimeouts();
      setPackOpeningData(null);
      setShowOverlay(false);
      // Optionally display error on screen for a short period
    });

    // Cleanup on unmount
    return () => {
      socket.off('packOpeningStarted');
      socket.off('packOpeningError');
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  if (!showOverlay || !packOpeningData) {
    return null; // Don't render anything if not active
  }

  const { viewer, card, stats } = packOpeningData;

  // Helper to determine text color for rarity (Tailwind classes)
  const getRarityColor = (rarity: Rarity) => {
    switch (rarity) {
      case Rarity.COMMON: return 'text-gray-400';
      case Rarity.UNCOMMON: return 'text-green-400';
      case Rarity.RARE: return 'text-blue-400';
      case Rarity.SUPER_RARE: return 'text-purple-400';
      case Rarity.EPIC: return 'text-yellow-400';
      case Rarity.LEGENDARY: return 'text-red-500';
      case Rarity.LEGENDARY_ALT: return 'text-red-300 animate-pulse'; // A bit more flashy
      default: return 'text-white';
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 overflow-hidden">
      {/* Pack Opening Animation Stage */}
      {animationStage === 'pack-open' && (
        <div className="text-white text-3xl animate-bounce">
          {viewer.username} is opening a pack!
        </div>
      )}

      {/* Card Reveal Stage */}
      {animationStage === 'card-reveal' && (
        <div className="relative flex flex-col items-center justify-center animate-fadeInZoom">
          <img
            src={card.image}
            alt={card.name}
            className="max-w-xs max-h-96 object-contain rounded-lg shadow-lg"
          />
          <p className={`mt-4 text-4xl font-bold ${getRarityColor(card.rarity)} animate-slideUp`}>
            {card.name}
          </p>
          <p className="text-xl text-white mt-2 animate-fadeIn delay-1000">{card.description}</p>
        </div>
      )}

      {/* Stats Display Stage */}
      {animationStage === 'stats-display' && (
        <div className="flex flex-col items-center justify-center text-white text-center animate-fadeIn">
          <h3 className="text-3xl font-bold mb-4">Stats for {viewer.username}</h3>
          <p className="text-2xl mb-2">
            Cards in this Set: <span className="font-semibold">{stats.distinctCardsInSet}</span>
          </p>
          <p className="text-2xl">
            Total Unique Cards: <span className="font-semibold">{stats.totalDistinctCards}</span>
          </p>
          {/* Add more stats if needed */}
        </div>
      )}
    </div>
  );
};
