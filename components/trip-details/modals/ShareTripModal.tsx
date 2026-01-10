import React, { useState, useCallback } from 'react';
import Modal from './Modal';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Base';
import { EmptyState } from '../../ui/EmptyState';
import { Trip } from '../../../types';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface ShareTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: Trip;
}

interface InvitedPerson {
    id: string;
    name: string;
    email: string;
    role: 'Visualizador' | 'Editor';
    status: 'Enviado' | 'Pendente';
    initials: string;
}

interface TripHighlight {
    day: number;
    city: string;
    description: string;
    image: string;
}

// =============================================================================
// Constants
// =============================================================================

const MOCK_TRIP_STATS = {
    days: 12,
    cities: 4,
    km: 150,
};

const MOCK_HIGHLIGHTS: TripHighlight[] = [
    { day: 1, city: 'Paris', description: 'Chegada e Jantar', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=400' },
    { day: 4, city: 'Roma', description: 'Coliseu', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=400' },
    { day: 7, city: 'Barcelona', description: 'Park Güell', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&q=80&w=400' },
    { day: 10, city: 'Lisboa', description: 'Elétrico 28', image: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&q=80&w=400' },
];

const SOCIAL_NETWORKS = [
    { name: 'Facebook', color: 'bg-[#1877f2]', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
    { name: 'Twitter', color: 'bg-[#1da1f2]', icon: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' },
    { name: 'WhatsApp', color: 'bg-[#25d366]', icon: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' },
];

// =============================================================================
// Helper Components
// =============================================================================

interface PrivacyOptionProps {
    isSelected: boolean;
    onClick: () => void;
    icon: string;
    title: string;
    description: string;
}

const PrivacyOption: React.FC<PrivacyOptionProps> = ({ isSelected, onClick, icon, title, description }) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
            }`}
    >
        <div className={`size-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${isSelected ? 'border-primary' : 'border-gray-300'
            }`}>
            {isSelected && <div className="size-2.5 rounded-full bg-primary" />}
        </div>
        <div className="text-left">
            <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-text-main">{title}</span>
                <span className="material-symbols-outlined text-base text-text-muted">{icon}</span>
            </div>
            <p className="text-xs text-text-muted">{description}</p>
        </div>
    </button>
);

interface TripPreviewCardProps {
    trip: Trip;
    stats: typeof MOCK_TRIP_STATS;
}

const TripPreviewCard: React.FC<TripPreviewCardProps> = ({ trip, stats }) => (
    <div className="bg-white rounded-2xl overflow-hidden shadow-soft border border-gray-100/50">
        {/* Cover Image */}
        <div className="relative h-48">
            <img
                src={trip.coverImage}
                alt={trip.title}
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg uppercase">
                    {trip.status === 'completed' ? 'Concluída' : trip.status === 'confirmed' ? 'Confirmada' : 'Planejando'}
                </span>
                <p className="text-white/70 text-xs mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {trip.startDate} - {trip.endDate}
                </p>
                <h2 className="text-2xl font-bold text-white mt-1">{trip.title}</h2>
            </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 py-4">
            <StatItem icon="schedule" value={`${stats.days} Dias`} label="Duração total" />
            <StatItem icon="location_on" value={`${stats.cities} Cidades`} label="Locais visitados" />
            <StatItem icon="directions_car" value={`${stats.km}km`} label="Percorridos" />
        </div>
    </div>
);

interface StatItemProps {
    icon: string;
    value: string;
    label: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, label }) => (
    <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-text-main">
            <span className="material-symbols-outlined text-primary">{icon}</span>
            <span className="text-xl font-bold">{value}</span>
        </div>
        <p className="text-xs text-text-muted">{label}</p>
    </div>
);

interface HighlightsCarouselProps {
    highlights: TripHighlight[];
}

const HighlightsCarousel: React.FC<HighlightsCarouselProps> = ({ highlights }) => (
    <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-main">Destaques</h3>
            <button className="text-xs text-primary font-bold">Ver todos</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {highlights.map((h, i) => (
                <div key={i} className="flex-shrink-0 w-32">
                    <div className="relative h-24 rounded-xl overflow-hidden mb-2">
                        <img src={h.image} alt={h.city} className="w-full h-full object-cover" />
                    </div>
                    <p className="font-bold text-xs text-text-main">Dia {h.day}: {h.city}</p>
                    <p className="text-xs text-text-muted truncate">{h.description}</p>
                </div>
            ))}
        </div>
    </div>
);

interface InvitedPersonItemProps {
    person: InvitedPerson;
    onRemove: (id: string) => void;
}

const InvitedPersonItem: React.FC<InvitedPersonItemProps> = ({ person, onRemove }) => (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
        <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-text-main">
                {person.initials}
            </div>
            <div>
                <p className="text-sm font-bold text-text-main">{person.name}</p>
                <p className="text-xs text-text-muted">{person.role}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${person.status === 'Enviado' ? 'text-primary' : 'text-text-muted'}`}>
                {person.status}
            </span>
            <button
                onClick={() => onRemove(person.id)}
                className="text-text-muted hover:text-rose-500 transition-colors"
            >
                <span className="material-symbols-outlined text-sm">close</span>
            </button>
        </div>
    </div>
);

interface SocialShareButtonsProps {
    shareLink: string;
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ shareLink }) => (
    <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
        <h3 className="font-bold text-text-main mb-3">Compartilhar nas redes</h3>
        <div className="flex gap-3">
            {SOCIAL_NETWORKS.map((network) => (
                <button
                    key={network.name}
                    className={`size-12 rounded-xl ${network.color} flex items-center justify-center text-white hover:opacity-90 transition-opacity`}
                    title={network.name}
                >
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d={network.icon} />
                    </svg>
                </button>
            ))}
            <button className="size-12 rounded-xl bg-gray-200 flex items-center justify-center text-text-muted hover:bg-gray-300 transition-colors">
                <span className="material-symbols-outlined">more_horiz</span>
            </button>
        </div>
    </div>
);

// =============================================================================
// Main Component
// =============================================================================

const ShareTripModal: React.FC<ShareTripModalProps> = ({ isOpen, onClose, trip }) => {
    const [isPublic, setIsPublic] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitedPeople, setInvitedPeople] = useState<InvitedPerson[]>([]);
    const [copiedLink, setCopiedLink] = useState(false);

    const shareLink = `https://tripmanager.app/s/${trip.id?.slice(0, 8) || 'euro-23'}`;

    const handleCopyLink = useCallback(() => {
        navigator.clipboard.writeText(shareLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    }, [shareLink]);

    const handleAddInvite = useCallback(() => {
        if (!inviteEmail || !inviteEmail.includes('@')) return;

        const newPerson: InvitedPerson = {
            id: Math.random().toString(36).substr(2, 9),
            name: inviteEmail.split('@')[0],
            email: inviteEmail,
            role: 'Visualizador',
            status: 'Pendente',
            initials: inviteEmail.slice(0, 2).toUpperCase(),
        };

        setInvitedPeople(prev => [...prev, newPerson]);
        setInviteEmail('');
    }, [inviteEmail]);

    const handleRemoveInvite = useCallback((id: string) => {
        setInvitedPeople(prev => prev.filter(p => p.id !== id));
    }, []);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddInvite();
        }
    }, [handleAddInvite]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Compartilhar Viagem"
            size="lg"
        >
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-6 -mt-2">
                <p className="text-text-muted text-sm">
                    Mostre ao mundo suas aventuras e reviva seus melhores momentos.
                </p>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        <span className="material-symbols-outlined text-base mr-2">visibility</span>
                        Pré-visualizar
                    </Button>
                    <Button size="sm">
                        <span className="material-symbols-outlined text-base mr-2">publish</span>
                        Publicar Agora
                    </Button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column - Trip Preview (3 cols) */}
                <div className="lg:col-span-3 space-y-6">
                    <TripPreviewCard trip={trip} stats={MOCK_TRIP_STATS} />

                    {/* About */}
                    <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
                        <h3 className="font-bold text-text-main mb-3">Sobre a viagem</h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                            Uma jornada inesquecível explorando as capitais mais vibrantes da Europa.
                            Da culinária refinada de Paris às ruínas históricas de Roma, cada momento foi uma nova descoberta.
                            Fizemos muitos amigos pelo caminho e coletamos memórias que durarão para sempre.
                        </p>
                    </div>

                    <HighlightsCarousel highlights={MOCK_HIGHLIGHTS} />
                </div>

                {/* Right Column - Sharing Options (2 cols) */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Privacy */}
                    <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
                        <h3 className="font-bold text-text-main mb-4">Privacidade</h3>
                        <div className="space-y-3">
                            <PrivacyOption
                                isSelected={isPublic}
                                onClick={() => setIsPublic(true)}
                                icon="public"
                                title="Público"
                                description="Qualquer pessoa com o link pode visualizar sua viagem."
                            />
                            <PrivacyOption
                                isSelected={!isPublic}
                                onClick={() => setIsPublic(false)}
                                icon="lock"
                                title="Privado"
                                description="Apenas você e convidados podem ver."
                            />
                        </div>
                    </div>

                    {/* Shareable Link */}
                    <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
                        <h3 className="font-bold text-text-main mb-3">Link Compartilhável</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={shareLink}
                                readOnly
                                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-text-muted"
                            />
                            <button
                                onClick={handleCopyLink}
                                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${copiedLink
                                    ? 'bg-green-500 text-white'
                                    : 'bg-primary text-text-main hover:bg-primary-dark'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-base">
                                    {copiedLink ? 'check' : 'content_copy'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Social Share */}
                    <SocialShareButtons shareLink={shareLink} />

                    {/* Invite People */}
                    <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
                        <h3 className="font-bold text-text-main mb-3">Convidar Pessoas</h3>
                        <div className="flex gap-2 mb-4">
                            <Input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="email@exemplo.com"
                                fullWidth
                            />
                            <button
                                onClick={handleAddInvite}
                                className="px-4 py-2.5 text-primary font-bold text-sm hover:bg-primary/5 rounded-xl transition-colors whitespace-nowrap"
                            >
                                Adicionar
                            </button>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {invitedPeople.length > 0 ? (
                                invitedPeople.map((person) => (
                                    <InvitedPersonItem
                                        key={person.id}
                                        person={person}
                                        onRemove={handleRemoveInvite}
                                    />
                                ))
                            ) : (
                                <EmptyState
                                    variant="minimal"
                                    title="Nenhum convidado ainda"
                                    description="Convide amigos para visualizar ou editar esta viagem"
                                    icon="group_add"
                                />
                            )}
                        </div>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1">
                            <span className="material-symbols-outlined text-base mr-2">picture_as_pdf</span>
                            PDF
                        </Button>
                        <Button variant="outline" className="flex-1">
                            <span className="material-symbols-outlined text-base mr-2">image</span>
                            Imagem
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ShareTripModal;
