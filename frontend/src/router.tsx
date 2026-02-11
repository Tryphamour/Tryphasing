import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from './pages/Admin/AdminLayout';
import { Overlay } from './pages/Overlay/Overlay';
import { NotFound } from './pages/NotFound';
import { SetManagement } from './pages/Admin/SetManagement';
import { CardManagement } from './pages/Admin/CardManagement';
import { DropRateManagement } from './pages/Admin/DropRateManagement'; // Import DropRateManagement

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
    errorElement: <NotFound />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <div className="text-gray-600">Select an option from the sidebar.</div>,
      },
      {
        path: 'sets', // /admin/sets
        element: <SetManagement />,
      },
      {
        path: 'cards', // /admin/cards
        element: <CardManagement />,
      },
      {
        path: 'drop-rates', // /admin/drop-rates
        element: <DropRateManagement />,
      },
      // Other admin routes will be added here
    ],
  },
  {
    path: '/overlay',
    element: <Overlay />,
  },
]);