import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
    const { login, signUp, loginWithGoogle, loginWithApple, loginWithBiometric, isLoading } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; form?: string }>({});
    const [isMobile, setIsMobile] = useState(false);

    React.useEffect(() => {
        // Detect mobile device
        const checkMobile = () => {
            setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
        };
        checkMobile();
    }, []);

    const validateForm = () => {
        const newErrors: { name?: string; email?: string; password?: string } = {};

        if (!isLogin && !name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        }

        if (!email) {
            newErrors.email = 'Email é obrigatório';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email inválido';
        }

        if (!password) {
            newErrors.password = 'Senha é obrigatória';
        } else if (password.length < 6) {
            newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) return;

        try {
            if (isLogin) {
                await login(email, password, rememberMe);
            } else {
                await signUp(email, password, name);
                alert('Cadastro realizado com sucesso! Verifique seu email para confirmar a conta.');
                setIsLogin(true);
            }
        } catch (error: any) {
            console.error('Auth failed:', error);
            let msg = 'Ocorreu um erro. Tente novamente.';
            if (error.message.includes('Invalid login')) msg = 'Email ou senha inválidos.';
            if (error.message.includes('already registered')) msg = 'Este email já está cadastrado.';
            setErrors(prev => ({ ...prev, form: msg }));
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error('Google login failed:', error);
        }
    };

    const handleAppleLogin = async () => {
        try {
            await loginWithApple();
        } catch (error) {
            console.error('Apple login failed:', error);
        }
    };

    const handleBiometricLogin = async () => {
        try {
            await loginWithBiometric();
        } catch (error) {
            console.error('Biometric login failed:', error);
        }
    };

    return (
        <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            {/* Hero Section - Hidden on mobile */}
            <div className="hidden md:flex md:w-2/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 via-indigo-600/90 to-blue-600/90" />

                {/* Animated background shapes */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute top-1/2 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
                    <div className="absolute -bottom-40 left-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-2000" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
                    <div className="mb-8 animate-float">
                        <div className="size-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
                            <span className="material-symbols-outlined text-5xl text-white">flight_takeoff</span>
                        </div>
                    </div>

                    <h1 className="text-5xl font-extrabold mb-4 text-center">PorAí</h1>
                    <p className="text-xl text-white/90 text-center max-w-md leading-relaxed">
                        Sua próxima aventura começa aqui
                    </p>

                    <div className="mt-12 space-y-4 text-center">
                        <div className="flex items-center gap-3 text-white/80">
                            <span className="material-symbols-outlined">check_circle</span>
                            <span className="text-sm">Planeje viagens incríveis</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/80">
                            <span className="material-symbols-outlined">check_circle</span>
                            <span className="text-sm">Organize documentos e roteiros</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/80">
                            <span className="material-symbols-outlined">check_circle</span>
                            <span className="text-sm">Compartilhe suas experiências</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Login Form Section */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-12">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="md:hidden text-center mb-8">
                        <div className="inline-flex size-16 bg-white/20 backdrop-blur-sm rounded-2xl items-center justify-center shadow-2xl border border-white/30 mb-4">
                            <span className="material-symbols-outlined text-4xl text-white">flight_takeoff</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-white">PorAí</h1>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20">
                        <div className="mb-8">
                            <h2 className="text-3xl font-extrabold text-text-main mb-2">
                                {isLogin ? 'Bem-vindo!' : 'Crie sua conta'}
                            </h2>
                            <p className="text-text-muted">
                                {isLogin ? 'Entre para continuar sua jornada' : 'Comece a planejar suas viagens hoje'}
                            </p>
                        </div>

                        {errors.form && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                                {errors.form}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Name Input (Sign Up Only) */}
                            {!isLogin && (
                                <div>
                                    <label className="block text-sm font-bold text-text-main mb-2">Nome Completo</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">person</span>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => {
                                                setName(e.target.value);
                                                setErrors({ ...errors, name: undefined });
                                            }}
                                            className={`w-full h-12 pl-12 pr-4 rounded-xl border-2 ${errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary'
                                                } focus:ring-4 focus:ring-primary/20 transition-all`}
                                            placeholder="Seu nome"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>
                                    )}
                                </div>
                            )}

                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-bold text-text-main mb-2">Email</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">email</span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setErrors({ ...errors, email: undefined });
                                        }}
                                        className={`w-full h-12 pl-12 pr-4 rounded-xl border-2 ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary'
                                            } focus:ring-4 focus:ring-primary/20 transition-all`}
                                        placeholder="seu@email.com"
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>
                                )}
                            </div>

                            {/* Password Input */}
                            <div>
                                <label className="block text-sm font-bold text-text-main mb-2">Senha</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">lock</span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setErrors({ ...errors, password: undefined });
                                        }}
                                        className={`w-full h-12 pl-12 pr-12 rounded-xl border-2 ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary'
                                            } focus:ring-4 focus:ring-primary/20 transition-all`}
                                        placeholder="••••••••"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>
                                )}
                            </div>

                            {/* Remember Me & Forgot Password (Login Only) */}
                            {isLogin && (
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-text-muted">Lembrar-me</span>
                                    </label>
                                    <button type="button" className="text-sm text-primary hover:text-primary-dark font-bold">
                                        Esqueceu a senha?
                                    </button>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{isLogin ? 'Entrar' : 'Criar Conta'}</span>
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-6">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-text-muted font-bold uppercase">ou continue com</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        {/* Social Login Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full h-12 bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-md rounded-xl font-bold text-text-main transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                <svg className="size-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>Continuar com Google</span>
                            </button>

                            {/* Face ID Button - Mobile Only */}
                            {isMobile && (
                                <button
                                    onClick={handleBiometricLogin}
                                    disabled={isLoading}
                                    className="w-full h-12 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
                                >
                                    <span className="material-symbols-outlined">fingerprint</span>
                                    <span>Entrar com Face ID</span>
                                </button>
                            )}
                        </div>

                        {/* Sign Up Link */}
                        <p className="text-center text-sm text-text-muted mt-6">
                            {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setErrors({});
                                    setPassword('');
                                }}
                                className="text-primary hover:text-primary-dark font-bold"
                            >
                                {isLogin ? 'Cadastre-se' : 'Fazer Login'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default Login;
