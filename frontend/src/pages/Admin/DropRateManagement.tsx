import React, { useState, useEffect } from 'react';
import { getDropRates, updateDropRate, Rarity } from '../../services/api';

interface DropRate {
  rarity: Rarity;
  rate: number;
}

export const DropRateManagement: React.FC = () => {
  const [dropRates, setDropRates] = useState<DropRate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRarity, setEditingRarity] = useState<Rarity | null>(null);
  const [newRate, setNewRate] = useState<number>(0);
  const [totalRate, setTotalRate] = useState<number>(0); // To display the sum of rates

  useEffect(() => {
    fetchDropRates();
  }, []);

  const fetchDropRates = async () => {
    try {
      setLoading(true);
      const fetchedDropRates = await getDropRates();
      setDropRates(fetchedDropRates);
      calculateTotal(fetchedDropRates);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (rates: DropRate[]) => {
    const sum = rates.reduce((acc, dr) => acc + dr.rate, 0);
    setTotalRate(parseFloat(sum.toFixed(3))); // Round to a few decimal places
  };

  const handleEditClick = (rarity: Rarity, currentRate: number) => {
    setEditingRarity(rarity);
    setNewRate(currentRate);
  };

  const handleSaveRate = async (rarity: Rarity) => {
    try {
      setError(null);
      const updatedDropRate = await updateDropRate(rarity, newRate);
      setDropRates(prevRates =>
        prevRates.map(dr => (dr.rarity === updatedDropRate.rarity ? updatedDropRate : dr))
      );
      calculateTotal(dropRates.map(dr => (dr.rarity === updatedDropRate.rarity ? updatedDropRate : dr))); // Recalculate total with updated rate
      setEditingRarity(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="text-gray-700 p-4">Loading drop rates...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Manage Drop Rates</h2>

      <div className="mb-6 p-4 border rounded shadow-sm bg-white">
        <h3 className="text-xl font-semibold mb-3">Current Drop Rates</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rarity</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (%)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dropRates.map((dr) => (
              <tr key={dr.rarity}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dr.rarity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingRarity === dr.rarity ? (
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      value={newRate}
                      onChange={(e) => setNewRate(parseFloat(e.target.value))}
                      className="w-24 border border-gray-300 rounded-md p-1 text-gray-900"
                    />
                  ) : (
                    <span>{(dr.rate * 100).toFixed(1)}%</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingRarity === dr.rarity ? (
                    <>
                      <button onClick={() => handleSaveRate(dr.rarity)} className="text-green-600 hover:text-green-900 mr-2">Save</button>
                      <button onClick={() => setEditingRarity(null)} className="text-red-600 hover:text-red-900">Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => handleEditClick(dr.rarity, dr.rate)} className="text-blue-600 hover:text-blue-900">Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-lg font-semibold">
          Total Rate: <span className={totalRate === 1 ? 'text-green-600' : 'text-red-600'}>{(totalRate * 100).toFixed(1)}%</span>
          {totalRate !== 1 && <span className="text-red-500 text-sm ml-2">(Should be 100%)</span>}
        </div>
      </div>
    </div>
  );
};
