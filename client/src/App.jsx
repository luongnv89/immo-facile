import React, { useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { store } from './store/store';
import Dashboard from './components/Dashboard';
import NotificationContainer from './components/NotificationContainer';
import Login from './pages/Login';
import { logout, selectIsAuthenticated } from './store/slices/authSlice';

function App() {
  useEffect(() => {
    // 401 responses anywhere in the app log the user out (#16)
    const onLogout = () => store.dispatch(logout());
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  return (
    <Provider store={store}>
      <AuthGate />
      <NotificationContainer />
    </Provider>
  );
}

function AuthGate() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  if (!isAuthenticated) return <Login />;
  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard />
    </div>
  );
}

export default App;
