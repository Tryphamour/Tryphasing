import React, { useState, useEffect } from 'react';
import { getCards, createCard, getSets, Rarity } from '../../services/api';

interface Card {
  id: string;
  name: string;
  description?: string;
  image: string;
  rarity: Rarity;
  setId: string;
  createdAt: string;
  updatedAt: string;
}

interface Set {
  id: string;
  name: string;
}

export const CardManagement: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [sets, setSets] = useState<Set[]>([]);
  const [newCardName, setNewCardName] = useState<string>('');
  const [newCardDescription, setNewCardDescription] = useState<string>('');
  const [newCardImage, setNewCardImage] = useState<string>('');
  const [newCardRarity, setNewCardRarity] = useState<Rarity>(Rarity.COMMON);
  const [newCardSetId, setNewCardSetId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const fetchedCards = await getCards();
      const fetchedSets = await getSets();
      setCards(fetchedCards);
      setSets(fetchedSets.map(set => ({ id: set.id, name: set.name })));
      // Set default set if available
      if (fetchedSets.length > 0) {
        setNewCardSetId(fetchedSets[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName || !newCardImage || !newCardSetId) {
      setError('Name, Image URL, and Set are required.');
      return;
    }
    try {
      setError(null);
      const createdCard = await createCard({
        name: newCardName,
        description: newCardDescription,
        image: newCardImage,
        rarity: newCardRarity,
        setId: newCardSetId,
      });
      setCards(prevCards => [...prevCards, createdCard]);
      setNewCardName('');
      setNewCardDescription('');
      setNewCardImage('');
      // Keep rarity and set selection for convenience
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="text-gray-700 p-4">Loading cards...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Manage Cards</h2>

      {/* Create New Card Form */}
      <div className="mb-8 p-4 border rounded shadow-sm bg-white">
        <h3 className="text-xl font-semibold mb-3">Create New Card</h3>
        <form onSubmit={handleCreateCard} className="space-y-3">
          <div>
            <label htmlFor="cardName" className="block text-sm font-medium text-gray-700">Card Name</label>
            <input
              type="text"
              id="cardName"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="cardDescription" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="cardDescription"
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={newCardDescription}
              onChange={(e) => setNewCardDescription(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="cardImage" className="block text-sm font-medium text-gray-700">Image URL</label>
            <input
              type="url"
              id="cardImage"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={newCardImage}
              onChange={(e) => setNewCardImage(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="cardRarity" className="block text-sm font-medium text-gray-700">Rarity</label>
            <select
              id="cardRarity"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={newCardRarity}
              onChange={(e) => setNewCardRarity(e.target.value as Rarity)}
              required
            >
              {Object.values(Rarity).map((rarity) => (
                <option key={rarity} value={rarity}>{rarity}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cardSet" className="block text-sm font-medium text-gray-700">Set</label>
            <select
              id="cardSet"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={newCardSetId}
              onChange={(e) => setNewCardSetId(e.target.value)}
              required
            >
              {sets.length === 0 ? (
                <option value="" disabled>No sets available</option>
              ) : (
                sets.map((set) => (
                  <option key={set.id} value={set.id}>{set.name}</option>
                ))
              )}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
            disabled={sets.length === 0}
          >
            Create Card
          </button>
        </form>
      </div>

      {/* List of Existing Cards */}
      <div className="p-4 border rounded shadow-sm bg-white">
        <h3 className="text-xl font-semibold mb-3">Existing Cards</h3>
        {cards.length === 0 ? (
          <p className="text-gray-600">No cards found. Create one above!</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {cards.map(card => (
              <li key={card.id} className="py-3 flex items-center space-x-4">
                <img src={card.image} alt={card.name} className="w-16 h-16 object-cover rounded-md" />
                <div className="flex-1">
                  <p className="text-lg font-medium text-gray-900">{card.name} ({card.rarity})</p>
                  <p className="text-sm text-gray-500">Set ID: {card.setId}</p>
                  {card.description && <p className="text-sm text-gray-600">{card.description}</p>}
                </div>
                {/* Add Edit/Delete buttons here later */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
