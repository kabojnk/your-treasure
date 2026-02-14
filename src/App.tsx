import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/AuthForm';
import { Layout } from './components/Layout';
import { APIProvider } from '@vis.gl/react-google-maps';
import './styles/global.css';

function App() {
  const { user, loading, signInWithPassword, signInWithMagicLink, signOut } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-link-high)',
        fontStyle: 'italic',
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <AuthForm
        onSignInWithPassword={signInWithPassword}
        onSignInWithMagicLink={signInWithMagicLink}
      />
    );
  }

  return (
    <APIProvider
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      version="beta"
    >
      <Layout user={user} onSignOut={signOut} />
    </APIProvider>
  );
}

export default App;
