'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import Chat from '../../../components/Chat';
import Login from '../../../components/Login';

export default function ChatPage() {
  const { docId } = useParams();
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return <Chat docId={docId as string} />;
}