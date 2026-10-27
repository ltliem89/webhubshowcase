import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends (React.Component as any) {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('[WebHub ErrorBoundary]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-lg border border-slate-200 mb-4 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Đang làm mới giao diện WebHub</h2>
          <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
            Hệ thống đang phục hồi trạng thái ổn định. Vui lòng bấm nút bên dưới để tải lại trang.
          </p>
          <button
            onClick={() => {
              try {
                localStorage.removeItem('webhub_projects_data_v18');
                localStorage.removeItem('webhub_projects_data_v19');
              } catch {}
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Tải lại trang ngay
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
