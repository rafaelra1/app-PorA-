import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="size-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl">error</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h1>
                        <p className="text-gray-600 mb-8">
                            Ocorreu um erro inesperado ao carregar o aplicativo. Por favor, tente recarregar a página.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 px-6 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                        >
                            Recarregar Página
                        </button>
                        {import.meta.env.DEV && this.state.error && (
                            <pre className="mt-8 p-4 bg-gray-100 rounded-lg text-left text-xs text-red-600 overflow-auto max-h-40">
                                {this.state.error.toString()}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
