import React from 'react';
import { Outlet, Link } from 'react-router-dom'; // Import Link

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
        <nav>
          <ul>
            <li className="mb-2"><Link to="/admin/sets" className="hover:text-blue-400">Sets</Link></li>
            <li className="mb-2"><Link to="/admin/cards" className="hover:text-blue-400">Cards</Link></li>
            <li className="mb-2"><Link to="/admin/drop-rates" className="hover:text-blue-400">Drop Rates</Link></li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Welcome to Admin Dashboard</h2>
        <p className="text-gray-600">Content will appear here.</p>
        <Outlet /> {/* Renders child routes */}
      </main>
    </div>
  );
};