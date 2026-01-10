import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components/ui/Base';
import { Switch } from '../components/ui/Switch';
import { useNotifications } from '../contexts/NotificationContext';

const Settings: React.FC = () => {
    const { preferences, preferencesLoading, updatePreferences } = useNotifications();

    // Local state for form (synced with context)
    const [notifications, setNotifications] = useState({
        tripReminders: true,
        documentAlerts: true,
        journalActivity: false,
        emailNotifications: true,
        pushNotifications: false,
        autoCreateEntities: false
    });

    const [display, setDisplay] = useState({
        language: 'pt',
        dateFormat: 'DD/MM/YYYY',
        currency: 'BRL',
        timeZone: 'America/Sao_Paulo'
    });

    const [privacy, setPrivacy] = useState({
        profileVisibility: 'public',
        shareData: true
    });

    const [aiSettings, setAiSettings] = useState({
        autoAnalyze: true,
        threshold: 14
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Sync local state with context preferences when loaded
    useEffect(() => {
        if (preferences) {
            setNotifications({
                tripReminders: preferences.tripReminders,
                documentAlerts: preferences.documentAlerts,
                journalActivity: preferences.journalActivity,
                emailNotifications: preferences.emailNotifications,
                pushNotifications: preferences.pushNotifications,
                autoCreateEntities: preferences.autoCreateEntities || false,
            });
        }
    }, [preferences]);

    const handleNotificationChange = (key: keyof typeof notifications) => {
        setNotifications({ ...notifications, [key]: !notifications[key] });
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        setSaveMessage(null);

        try {
            await updatePreferences({
                tripReminders: notifications.tripReminders,
                documentAlerts: notifications.documentAlerts,
                journalActivity: notifications.journalActivity,
                emailNotifications: notifications.emailNotifications,
                pushNotifications: notifications.pushNotifications,
                autoCreateEntities: notifications.autoCreateEntities,
            });
            setSaveMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });

            // Clear message after 3 seconds
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            setSaveMessage({ type: 'error', text: 'Erro ao salvar configurações. Tente novamente.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-text-main">Configurações</h2>
                    <p className="text-sm text-text-muted mt-1">Personalize sua experiência no PorAí</p>
                </div>
                <div className="flex items-center gap-3">
                    {saveMessage && (
                        <span className={`text-sm font-medium ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {saveMessage.text}
                        </span>
                    )}
                    <Button
                        variant="primary"
                        onClick={handleSaveSettings}
                        disabled={isSaving || preferencesLoading}
                        className="!px-6 !py-2.5 !text-sm"
                    >
                        {isSaving ? (
                            <>
                                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span className="ml-2">Salvando...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg mr-2">save</span>
                                Salvar Alterações
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Account Settings */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">person</span>
                    </div>
                    <h4 className="text-xl font-bold text-text-main">Conta</h4>
                </div>
                <div className="space-y-4">
                    <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-text-muted">lock</span>
                            <div>
                                <p className="text-sm font-bold text-text-main">Alterar Senha</p>
                                <p className="text-xs text-text-muted">Última alteração há 3 meses</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-text-muted group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-text-muted">email</span>
                            <div>
                                <p className="text-sm font-bold text-text-main">Preferências de Email</p>
                                <p className="text-xs text-text-muted">Gerencie suas assinaturas</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-text-muted group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>
            </Card>

            {/* Notification Settings */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">notifications</span>
                    </div>
                    <h4 className="text-xl font-bold text-text-main">Notificações</h4>
                </div>
                <div className="divide-y divide-gray-100">
                    <Switch
                        checked={notifications.tripReminders}
                        onChange={() => handleNotificationChange('tripReminders')}
                        label="Lembretes de Viagem"
                        description="Receba notificações antes das suas viagens"
                    />
                    <Switch
                        checked={notifications.documentAlerts}
                        onChange={() => handleNotificationChange('documentAlerts')}
                        label="Alertas de Documentos"
                        description="Avisos sobre vencimento de documentos"
                    />
                    <Switch
                        checked={notifications.journalActivity}
                        onChange={() => handleNotificationChange('journalActivity')}
                        label="Atividade do Diário"
                        description="Notificações de curtidas e comentários"
                    />
                    <Switch
                        checked={notifications.emailNotifications}
                        onChange={() => handleNotificationChange('emailNotifications')}
                        label="Notificações por Email"
                        description="Receba atualizações por email"
                    />
                    <Switch
                        checked={notifications.pushNotifications}
                        onChange={() => handleNotificationChange('pushNotifications')}
                        label="Notificações Push"
                        description="Notificações no navegador"
                    />
                    <Switch
                        checked={notifications.autoCreateEntities}
                        onChange={() => handleNotificationChange('autoCreateEntities')}
                        label="Sincronização Automática"
                        description="Criar transportes e hospedagens automaticamente ao adicionar documentos"
                    />
                </div>
            </Card>

            {/* AI Settings */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">auto_awesome</span>
                    </div>
                    <h4 className="text-xl font-bold text-text-main">Inteligência Artificial</h4>
                </div>
                <div className="divide-y divide-gray-100">
                    <Switch
                        checked={aiSettings.autoAnalyze}
                        onChange={() => setAiSettings({ ...aiSettings, autoAnalyze: !aiSettings.autoAnalyze })}
                        label="Análise Automática de Checklist"
                        description="Sugere tarefas automaticamente baseadas no seu destino"
                    />
                    <div className="py-4">
                        <label className="text-sm font-bold text-text-main mb-2 block text-sm">Antecedência da Análise</label>
                        <select
                            value={aiSettings.threshold}
                            onChange={(e) => setAiSettings({ ...aiSettings, threshold: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer text-sm"
                        >
                            <option value={7}>7 dias antes da viagem</option>
                            <option value={14}>14 dias antes da viagem</option>
                            <option value={30}>30 dias antes da viagem</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Display Settings */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">display_settings</span>
                    </div>
                    <h4 className="text-xl font-bold text-text-main">Exibição</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-bold text-text-main mb-2 block">Idioma</label>
                        <select
                            value={display.language}
                            onChange={(e) => setDisplay({ ...display, language: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
                        >
                            <option value="pt">Português (Brasil)</option>
                            <option value="en">English (US)</option>
                            <option value="es">Español</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-text-main mb-2 block">Formato de Data</label>
                        <select
                            value={display.dateFormat}
                            onChange={(e) => setDisplay({ ...display, dateFormat: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
                        >
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-text-main mb-2 block">Moeda</label>
                        <select
                            value={display.currency}
                            onChange={(e) => setDisplay({ ...display, currency: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
                        >
                            <option value="BRL">Real (R$)</option>
                            <option value="USD">Dólar ($)</option>
                            <option value="EUR">Euro (€)</option>
                            <option value="GBP">Libra (£)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-text-main mb-2 block">Fuso Horário</label>
                        <select
                            value={display.timeZone}
                            onChange={(e) => setDisplay({ ...display, timeZone: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
                        >
                            <option value="America/Sao_Paulo">Brasília (UTC-3)</option>
                            <option value="America/New_York">Nova York (UTC-5)</option>
                            <option value="Europe/London">Londres (UTC+0)</option>
                            <option value="Asia/Tokyo">Tóquio (UTC+9)</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Data & Privacy */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">shield</span>
                    </div>
                    <h4 className="text-xl font-bold text-text-main">Dados & Privacidade</h4>
                </div>
                <div className="space-y-4">
                    <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-text-muted">download</span>
                            <div>
                                <p className="text-sm font-bold text-text-main">Baixar Meus Dados</p>
                                <p className="text-xs text-text-muted">Exportar todas as suas informações</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-text-muted group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-text-muted">folder_zip</span>
                            <div>
                                <p className="text-sm font-bold text-text-main">Exportar Viagens</p>
                                <p className="text-xs text-text-muted">Salvar suas viagens em PDF</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-text-muted group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                    <div className="pt-3 border-t border-gray-100">
                        <Switch
                            checked={privacy.shareData}
                            onChange={() => setPrivacy({ ...privacy, shareData: !privacy.shareData })}
                            label="Compartilhar Dados de Uso"
                            description="Ajude-nos a melhorar o PorAí"
                        />
                    </div>
                </div>
            </Card>

            {/* About */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">info</span>
                    </div>
                    <h4 className="text-xl font-bold text-text-main">Sobre</h4>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-text-muted">Versão do App</span>
                        <span className="text-sm font-bold text-text-main">1.0.0</span>
                    </div>
                    <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between group">
                        <span className="text-sm font-bold text-text-main">Termos de Serviço</span>
                        <span className="material-symbols-outlined text-text-muted group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between group">
                        <span className="text-sm font-bold text-text-main">Política de Privacidade</span>
                        <span className="material-symbols-outlined text-text-muted group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between group">
                        <span className="text-sm font-bold text-text-main">Central de Ajuda</span>
                        <span className="material-symbols-outlined text-text-muted group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-2 border-red-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">warning</span>
                    </div>
                    <h4 className="text-xl font-bold text-red-600">Zona de Perigo</h4>
                </div>
                <button className="w-full px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-between group border-2 border-red-200">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-600">delete_forever</span>
                        <div className="text-left">
                            <p className="text-sm font-bold text-red-600">Excluir Conta</p>
                            <p className="text-xs text-red-500">Esta ação não pode ser desfeita</p>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-red-600">arrow_forward</span>
                </button>
            </Card>
        </div>
    );
};

export default Settings;
