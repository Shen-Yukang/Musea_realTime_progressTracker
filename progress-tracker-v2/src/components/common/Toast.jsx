import { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose && onClose(), 300); // 等待动画完成
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "flex items-center p-4 rounded-lg shadow-lg transition-all duration-300 transform";
    
    if (!isVisible) {
      return `${baseStyles} opacity-0 translate-y-2`;
    }

    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border border-green-200`;
      case 'error':
        return `${baseStyles} bg-red-50 border border-red-200`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border border-yellow-200`;
      default:
        return `${baseStyles} bg-blue-50 border border-blue-200`;
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className={getStyles()}>
      {getIcon()}
      <span className={`ml-3 text-sm font-medium ${getTextColor()}`}>
        {message}
      </span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose && onClose(), 300);
        }}
        className={`ml-auto pl-3 ${getTextColor()} hover:opacity-70`}
      >
        <span className="sr-only">关闭</span>
        ✕
      </button>
    </div>
  );
};

export default Toast;
