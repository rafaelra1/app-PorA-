import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTrips } from '@/contexts/TripContext';
import { Card, Button, Badge } from '../components/ui/Base';

const Profile: React.FC = () => {
    const { user } = useAuth();
    const { trips } = useTrips();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        role: user?.role || 'Viajante',
        email: user?.email || '',
        phone: user?.phone || '',
        location: user?.location || '',
        bio: user?.bio || ''
    });

    // Update form data when user changes
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                role: user.role || 'Viajante',
                email: user.email,
                phone: user.phone || '',
                location: user.location || '',
                bio: user.bio || ''
            });
        }
    }, [user]);

    const handleSave = () => {
        // TODO: Implement profile persistence
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset form data to user data
        if (user) {
            setFormData({
                name: user.name,
                role: user.role || 'Viajante',
                email: user.email,
                phone: user.phone || '',
                location: user.location || '',
                bio: user.bio || ''
            });
        }
    };

    // Calculate stats from trips
    const totalTrips = trips.length;
    const countriesVisited = new Set(trips.map(t => t.destination?.split(',')[1]?.trim() || t.destination)).size;
    const citiesVisited = new Set(trips.map(t => t.destination?.split(',')[0]?.trim())).size;
    const totalDays = trips.reduce((acc, t) => {
        if (!t.startDate || !t.endDate) return acc;
        // Parse dates in DD/MM/YYYY format
        const startParts = t.startDate.split('/');
        const endParts = t.endDate.split('/');

        const start = new Date(parseInt(startParts[2]), parseInt(startParts[1]) - 1, parseInt(startParts[0]));
        const end = new Date(parseInt(endParts[2]), parseInt(endParts[1]) - 1, parseInt(endParts[0]));

        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        return acc + (isNaN(days) ? 0 : days);
    }, 0);

    const stats = [
        { label: 'Viagens', value: totalTrips.toString(), icon: 'luggage', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Países', value: countriesVisited.toString(), icon: 'public', color: 'bg-blue-50 text-blue-600' },
        { label: 'Cidades', value: citiesVisited.toString(), icon: 'location_city', color: 'bg-purple-50 text-purple-600' },
        { label: 'Dias Viajando', value: totalDays.toString(), icon: 'calendar_month', color: 'bg-green-50 text-green-600' }
    ];

    const travelPreferences = [
        { label: 'Estilo de Viagem', value: 'Aventura, Cultura' },
        { label: 'Tipo de Hospedagem', value: 'Hotéis Boutique' },
        { label: 'Orçamento Médio', value: 'R$ 5.000 - R$ 10.000' },
        { label: 'Destinos Favoritos', value: 'Europa, Ásia' }
    ];

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-text-main">Meu Perfil</h2>
                    <p className="text-sm text-text-muted mt-1">Gerencie suas informações pessoais e preferências</p>
                </div>
                {!isEditing ? (
                    <Button
                        variant="primary"
                        onClick={() => setIsEditing(true)}
                        className="!px-6 !py-2.5 !text-sm"
                    >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Editar Perfil
                    </Button>
                ) : (
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="!px-6 !py-2.5 !text-sm"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            className="!px-6 !py-2.5 !text-sm"
                        >
                            <span className="material-symbols-outlined text-lg">save</span>
                            Salvar
                        </Button>
                    </div>
                )}
            </div>

            {/* Profile Header Card */}
            <Card className="p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Avatar Section */}
                    <div className="relative group">
                        <img
                            src={user?.avatar}
                            alt="Profile"
                            className="size-32 rounded-2xl object-cover shadow-lg"
                        />
                        {isEditing && (
                            <button className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                            </button>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 space-y-4">
                        {isEditing ? (
                            <>
                                <div>
                                    <label className="text-sm font-bold text-text-main mb-2 block">Nome</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-text-main mb-2 block">Função</label>
                                    <input
                                        type="text"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-text-main mb-2 block">Bio</label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <h3 className="text-3xl font-extrabold text-text-main">{formData.name}</h3>
                                    <p className="text-lg text-text-muted mt-1">{formData.role}</p>
                                </div>
                                <p className="text-sm text-text-muted leading-relaxed">{formData.bio}</p>
                                <div className="flex items-center gap-2 text-sm text-text-muted">
                                    <span className="material-symbols-outlined text-lg">calendar_today</span>
                                    <span>Membro desde Janeiro 2023</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.label} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className={`size-14 rounded-xl ${stat.color} flex items-center justify-center`}>
                                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                            </div>
                            <div>
                                <p className="text-3xl font-extrabold text-text-main">{stat.value}</p>
                                <p className="text-xs text-text-muted mt-1 font-bold uppercase tracking-wider">{stat.label}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Personal Information */}
            <Card className="p-6">
                <h4 className="text-xl font-bold text-text-main mb-6">Informações Pessoais</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-bold text-text-main mb-2 block">Email</label>
                        {isEditing ? (
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        ) : (
                            <p className="text-text-muted">{formData.email}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-bold text-text-main mb-2 block">Telefone</label>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        ) : (
                            <p className="text-text-muted">{formData.phone}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-bold text-text-main mb-2 block">Localização</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        ) : (
                            <p className="text-text-muted">{formData.location}</p>
                        )}
                    </div>
                </div>
            </Card>

            {/* Travel Preferences */}
            <Card className="p-6">
                <h4 className="text-xl font-bold text-text-main mb-6">Preferências de Viagem</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {travelPreferences.map((pref) => (
                        <div key={pref.label}>
                            <label className="text-sm font-bold text-text-main mb-2 block">{pref.label}</label>
                            <p className="text-text-muted">{pref.value}</p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default Profile;
