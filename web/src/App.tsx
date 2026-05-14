import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/auth.context';
import ProtectedRoute from './components/protected-route';
import Layout from './components/layout';
import LoginPage from './pages/login.page';
import InboxPage from './pages/inbox.page';
import SentPage from './pages/sent.page';
import ComposePage from './pages/compose.page';
import MessageDetailPage from './pages/message-detail.page';
import SearchPage from './pages/search.page';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/inbox" replace /> : <LoginPage />
        }
      />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/sent" element={<SentPage />} />
          <Route path="/compose" element={<ComposePage />} />
          <Route path="/messages/:id" element={<MessageDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/inbox" replace />} />
    </Routes>
  );
}
