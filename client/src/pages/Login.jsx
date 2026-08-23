import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, selectIsAuthenticated, clearAuthError } from '../store/slices/authSlice';

/**
 * Minimal login gate.
 * Rendered instead of the dashboard while unauthenticated.
 */
export default function Login() {
  const dispatch = useDispatch();
  const status = useSelector(state => state.auth.status);
  const error = useSelector(state => state.auth.error);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) return null;

  const handleSubmit = e => {
    e.preventDefault();
    dispatch(loginUser({ username, password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">ImmoFacile</h1>
        <p className="text-sm text-gray-500 mb-6">Gestion de locations — connexion requise</p>
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulaire de connexion">
          <div>
            <label
              htmlFor="login-username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nom d'utilisateur
            </label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mot de passe
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={status === 'loading'}
            onClick={() => dispatch(clearAuthError())}
            className="w-full min-h-[44px] bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {status === 'loading' ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
