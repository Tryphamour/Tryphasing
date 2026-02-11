import React, { useState, useEffect } from 'react';
import { getSets, createSet } from '../../services/api';

interface Set {
  id: string;
  name: string;
  image: string;
  totalCards: number;
}

export const SetManagement: React.FC = () => {
  const [sets, setSets] = useState<Set[]>([]);
  const [newSetName, setNewSetName] = useState<string>('');
  const [newSetImage, setNewSetImage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      setLoading(true);
      const fetchedSets = await getSets();
      setSets(fetchedSets);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetName || !newSetImage) {
      setError('Name and Image URL are required.');
      return;
    }
    try {
      setError(null);
      const createdSet = await createSet({ name: newSetName, image: newSetImage });
      setSets(prevSets => [...prevSets, createdSet]);
      setNewSetName('');
      setNewSetImage('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="text-gray-700">Loading sets...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Manage Sets</h2>

      {/* Create New Set Form */}
      <div className="mb-8 p-4 border rounded shadow-sm bg-white">
        <h3 className="text-xl font-semibold mb-3">Create New Set</h3>
        <form onSubmit={handleCreateSet} className="space-y-3">
          <div>
            <label htmlFor="setName" className="block text-sm font-medium text-gray-700">Set Name</label>
            <input
              type="text"
              id="setName"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="setImage" className="block text-sm font-medium text-gray-700">Image URL</label>
            <input
              type="url"
              id="setImage"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={newSetImage}
              onChange={(e) => setNewSetImage(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
          >
            Create Set
          </button>
        </form>
      </div>

      {/* List of Existing Sets */}
      <div className="p-4 border rounded shadow-sm bg-white">
        <h3 className="text-xl font-semibold mb-3">Existing Sets</h3>
        {sets.length === 0 ? (
          <p className="text-gray-600">No sets found. Create one above!</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sets.map(set => (
              <li key={set.id} className="py-3 flex items-center space-x-4">
                <img src={set.image} alt={set.name} className="w-16 h-16 object-cover rounded-md" />
                <div className="flex-1">
                  <p className="text-lg font-medium text-gray-900">{set.name}</p>
                  <p className="text-sm text-gray-500">ID: {set.id}</p>
                  <p className="text-sm text-gray-500">Total Cards: {set.totalCards}</p>
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
