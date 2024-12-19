import toast, { ToastOptions } from 'react-hot-toast';
import { useTheme } from 'next-themes';

// Custom toast options based on affiliate theme
const useCustomToast = () => {
  const { theme } = useTheme();

  // Get theme colors based on domain
  const getThemeColors = () => {
    const domain = window.location.hostname;
    switch (domain) {
      case 'nunge.winguapps.co.ke':
        return {
          primary: '#7A1253',
          secondary: '#9A2973',
          text: '#FFFFFF',
        };
      default: // nungereturns.com
        return {
          primary: 'purple',
          secondary: '#6B21A8',
          text: '#FFFFFF',
        };
    }
  };

  // Base toast options
  const baseToastOptions: ToastOptions = {
    duration: 4000,
    position: 'top-right',
  };

  // Success toast
  const success = (message: string) => {
    const colors = getThemeColors();
    toast.success(message, {
      ...baseToastOptions,
      style: {
        background: colors.primary,
        color: colors.text,
        padding: '16px',
        borderRadius: '8px',
      },
      iconTheme: {
        primary: colors.text,
        secondary: colors.primary,
      },
    });
  };

  // Error toast
  const error = (message: string) => {
    const colors = getThemeColors();
    toast.error(message, {
      ...baseToastOptions,
      style: {
        background: '#DC2626',
        color: '#FFFFFF',
        padding: '16px',
        borderRadius: '8px',
      },
    });
  };

  // Warning toast
  const warning = (message: string) => {
    toast(message, {
      ...baseToastOptions,
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: '#FFFFFF',
        padding: '16px',
        borderRadius: '8px',
      },
    });
  };

  // Info toast
  const info = (message: string) => {
    const colors = getThemeColors();
    toast(message, {
      ...baseToastOptions,
      icon: 'ℹ️',
      style: {
        background: colors.secondary,
        color: colors.text,
        padding: '16px',
        borderRadius: '8px',
      },
    });
  };

  // Loading toast
  const loading = (message: string) => {
    return toast.loading(message, {
      ...baseToastOptions,
      style: {
        background: '#1F2937',
        color: '#FFFFFF',
        padding: '16px',
        borderRadius: '8px',
      },
    });
  };

  // Custom toast with progress bar
  const withProgress = (message: string, promise: Promise<any>) => {
    const colors = getThemeColors();
    return toast.promise(promise, {
      loading: 'Loading...',
      success: message,
      error: 'Error occurred',
    }, {
      style: {
        background: colors.primary,
        color: colors.text,
        padding: '16px',
        borderRadius: '8px',
      },
    });
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    withProgress,
  };
};

export default useCustomToast;
