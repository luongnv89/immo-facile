import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Dashboard from './components/Dashboard';
import NotificationContainer from './components/NotificationContainer';

function App() {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-50">
        <Dashboard />
        <NotificationContainer />
      </div>
    </Provider>
  );
}

export default App;
