'use client';

import { useAuth } from '../context/AuthContext';
import Login from '../components/Login';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return user ? <Dashboard /> : <Login />;
}
