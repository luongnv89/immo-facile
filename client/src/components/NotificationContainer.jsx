import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeNotification } from '../store/slices/uiSlice';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const NotificationContainer = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(state => state.ui.notifications);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.duration) {
        const timer = setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, notification.duration);
        
        return () => clearTimeout(timer);
      }
    });
  }, [notifications, dispatch]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getBackgroundColor(notification.type)} border rounded-lg p-4 shadow-lg transition-all duration-300 ease-in-out`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="ml-3 flex-1">
              {notification.title && (
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {notification.title}
                </h4>
              )}
              <p className="text-sm text-gray-700">{notification.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => dispatch(removeNotification(notification.id))}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
