import React, { useState, useCallback, useRef, useMemo } from 'react';
import Modal from './Modal';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Base';
import { EmptyState } from '../../ui/EmptyState';
import { Trip, ItineraryActivity, City, HotelReservation, Transport } from '../../../types';
import { useToast } from '../../../contexts/ToastContext';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface ShareTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: Trip;
    cities?: City[];
    activities?: ItineraryActivity[];
    hotels?: HotelReservation[];
    transports?: Transport[];
}

interface InvitedPerson {
    id: string;
    name: string;
    email: string;
    role: 'Visualizador' | 'Editor';
    status: 'Pendente' | 'Aceito';
    initials: string;
    avatar?: string;
}

interface TripHighlight {
    day: number;
    city: string;
    description: string;
    image: string;
}

type PrivacyMode = 'public' | 'private';

// =============================================================================
// Utility Functions
// =============================================================================

const generatePublicToken = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const segments = [3, 3, 3];
    return segments
        .map(len =>
            Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
        )
        .join('-');
};

const calculateTripDays = (startDate: string, endDate: string): number => {
    try {
        const parseDate = (d: string) => {
            if (d.includes('/')) {
                const [day, month, year] = d.split('/');
                return new Date(`${year}-${month}-${day}`);
            }
            return new Date(d);
        };
        const start = parseDate(startDate);
        const end = parseDate(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } catch {
        return 0;
    }
};

const calculateTotalKm = (transports?: Transport[]): number => {
    if (!transports || transports.length === 0) return 0;
    // Approximate: 100km per flight, 50km per train, 30km per other
    return transports.reduce((total, t) => {
        if (t.type === 'flight') return total + 800;
        if (t.type === 'train') return total + 300;
        return total + 50;
    }, 0);
};

const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

const formatDate = (dateStr: string): string => {
    try {
        const parseDate = (d: string) => {
            if (d.includes('/')) {
                const [day, month, year] = d.split('/');
                return new Date(`${year}-${month}-${day}`);
            }
            return new Date(d);
        };
        const date = parseDate(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return dateStr;
    }
};

// =============================================================================
// Social Share URLs
// =============================================================================

const buildSocialUrls = (title: string, url: string) => ({
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
});

// =============================================================================
// Constants
// =============================================================================

const SOCIAL_NETWORKS = [
    {
        name: 'Facebook',
        key: 'facebook' as const,
        color: 'bg-[#1877f2]',
        icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'
    },
    {
        name: 'Twitter',
        key: 'twitter' as const,
        color: 'bg-[#1da1f2]',
        icon: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z'
    },
    {
        name: 'WhatsApp',
        key: 'whatsapp' as const,
        color: 'bg-[#25d366]',
        icon: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'
    },
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
    stats: { days: number; cities: number; km: number };
    previewRef: React.RefObject<HTMLDivElement | null>;
}

const TripPreviewCard: React.FC<TripPreviewCardProps> = ({ trip, stats, previewRef }) => (
    <div ref={previewRef} className="bg-white rounded-2xl overflow-hidden shadow-soft border border-gray-100/50">
        {/* Cover Image */}
        <div className="relative h-48">
            <img
                src={trip.coverImage}
                alt={trip.title}
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4">
                <span className={`px-3 py-1 text-white text-xs font-bold rounded-lg uppercase ${trip.status === 'completed' ? 'bg-gray-500' :
                    trip.status === 'confirmed' ? 'bg-green-500' : 'bg-primary'
                    }`}>
                    {trip.status === 'completed' ? 'Concluída' : trip.status === 'confirmed' ? 'Confirmada' : 'Planejando'}
                </span>
                <p className="text-white/70 text-xs mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
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
    onViewAll?: () => void;
}

const HighlightsCarousel: React.FC<HighlightsCarouselProps> = ({ highlights, onViewAll }) => (
    <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-main">Destaques</h3>
            {onViewAll && (
                <button onClick={onViewAll} className="text-xs text-primary font-bold hover:underline">
                    Ver todos
                </button>
            )}
        </div>
        {highlights.length > 0 ? (
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
        ) : (
            <p className="text-sm text-text-muted text-center py-4">
                Adicione atividades ao roteiro para ver os destaques
            </p>
        )}
    </div>
);

interface InvitedPersonItemProps {
    person: InvitedPerson;
    onRemove: (id: string) => void;
}

const InvitedPersonItem: React.FC<InvitedPersonItemProps> = ({ person, onRemove }) => (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
            {person.avatar ? (
                <img src={person.avatar} alt={person.name} className="size-8 rounded-full object-cover" />
            ) : (
                <div className="size-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-bold text-primary">
                    {person.initials}
                </div>
            )}
            <div>
                <p className="text-sm font-bold text-text-main">{person.name}</p>
                <p className="text-xs text-text-muted">{person.email}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${person.status === 'Aceito'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
                }`}>
                {person.status}
            </span>
            <button
                onClick={() => onRemove(person.id)}
                className="p-1 text-text-muted hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                aria-label="Remover convidado"
            >
                <span className="material-symbols-outlined text-sm">delete</span>
            </button>
        </div>
    </div>
);

interface SocialShareButtonsProps {
    shareLink: string;
    tripTitle: string;
    isDisabled?: boolean;
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ shareLink, tripTitle, isDisabled }) => {
    const socialUrls = buildSocialUrls(tripTitle, shareLink);

    const handleShare = (key: 'facebook' | 'twitter' | 'whatsapp') => {
        if (isDisabled) return;
        window.open(socialUrls[key], '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
            <h3 className="font-bold text-text-main mb-3">Compartilhar nas redes</h3>
            <div className={`flex gap-3 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                {SOCIAL_NETWORKS.map((network) => (
                    <button
                        key={network.name}
                        onClick={() => handleShare(network.key)}
                        disabled={isDisabled}
                        className={`size-12 rounded-xl ${network.color} flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:cursor-not-allowed`}
                        title={network.name}
                    >
                        <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d={network.icon} />
                        </svg>
                    </button>
                ))}
                <button
                    className="size-12 rounded-xl bg-gray-200 flex items-center justify-center text-text-muted hover:bg-gray-300 transition-colors disabled:cursor-not-allowed"
                    disabled={isDisabled}
                    title="Mais opções"
                >
                    <span className="material-symbols-outlined">more_horiz</span>
                </button>
            </div>
        </div>
    );
};

// =============================================================================
// Main Component
// =============================================================================

const ShareTripModal: React.FC<ShareTripModalProps> = ({
    isOpen,
    onClose,
    trip,
    cities = [],
    activities = [],
    transports = []
}) => {
    const { showToast } = useToast();
    const [privacyMode, setPrivacyMode] = useState<PrivacyMode>('public');
    const [inviteEmail, setInviteEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [invitedPeople, setInvitedPeople] = useState<InvitedPerson[]>([]);
    const [copiedLink, setCopiedLink] = useState(false);
    const [isExportingImage, setIsExportingImage] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const previewCardRef = useRef<HTMLDivElement>(null);
    const publicToken = useMemo(() => generatePublicToken(), []);

    const shareLink = `https://porai.app/s/${publicToken}`;
    const isPrivate = privacyMode === 'private';

    // Calculate dynamic stats
    const tripStats = useMemo(() => ({
        days: calculateTripDays(trip.startDate, trip.endDate),
        cities: cities.length || trip.detailedDestinations?.length || 1,
        km: calculateTotalKm(transports),
    }), [trip, cities, transports]);

    // Generate highlights from activities
    const highlights: TripHighlight[] = useMemo(() => {
        if (activities.length === 0) {
            // Fallback to cities if no activities
            return cities.slice(0, 3).map((city, index) => ({
                day: index + 1,
                city: city.name,
                description: city.headline || `Explore ${city.name}`,
                image: city.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=400',
            }));
        }

        return activities
            .filter(a => a.image || a.location)
            .slice(0, 3)
            .map(activity => ({
                day: activity.day,
                city: activity.location?.split(',')[0] || 'Destino',
                description: activity.title,
                image: activity.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=400',
            }));
    }, [activities, cities]);

    const handleCopyLink = useCallback(async () => {
        if (isPrivate) return;

        try {
            await navigator.clipboard.writeText(shareLink);
            setCopiedLink(true);
            showToast('Link copiado!', 'success');
            setTimeout(() => setCopiedLink(false), 2000);
        } catch {
            showToast('Erro ao copiar link', 'error');
        }
    }, [shareLink, isPrivate, showToast]);

    const handleAddInvite = useCallback(() => {
        setEmailError('');

        if (!inviteEmail.trim()) {
            setEmailError('Digite um email');
            return;
        }

        if (!validateEmail(inviteEmail)) {
            setEmailError('Email inválido');
            return;
        }

        if (invitedPeople.some(p => p.email.toLowerCase() === inviteEmail.toLowerCase())) {
            setEmailError('Email já adicionado');
            return;
        }

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
        showToast('Convite adicionado', 'success');
    }, [inviteEmail, invitedPeople, showToast]);

    const handleRemoveInvite = useCallback((id: string) => {
        setInvitedPeople(prev => prev.filter(p => p.id !== id));
        showToast('Convite removido', 'info');
    }, [showToast]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddInvite();
        }
    }, [handleAddInvite]);

    const handleExportImage = useCallback(async () => {
        if (!previewCardRef.current) return;

        setIsExportingImage(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(previewCardRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
            });

            const link = document.createElement('a');
            link.download = `${trip.title.replace(/\s+/g, '_')}_preview.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            showToast('Imagem exportada com sucesso!', 'success');
        } catch (error) {
            console.error('Error exporting image:', error);
            showToast('Erro ao exportar imagem', 'error');
        } finally {
            setIsExportingImage(false);
        }
    }, [trip.title, showToast]);

    const handleExportPdf = useCallback(async () => {
        setIsExportingPdf(true);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            // Title
            doc.setFontSize(24);
            doc.setTextColor(79, 70, 229); // Primary color
            doc.text(trip.title, 20, 30);

            // Dates
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text(`${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`, 20, 40);

            // Stats
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text(`Duração: ${tripStats.days} dias`, 20, 55);
            doc.text(`Cidades: ${tripStats.cities}`, 20, 65);
            doc.text(`Distância estimada: ${tripStats.km}km`, 20, 75);

            // Activities
            if (activities.length > 0) {
                doc.setFontSize(16);
                doc.setTextColor(79, 70, 229);
                doc.text('Roteiro', 20, 95);

                let yPos = 105;
                doc.setFontSize(11);
                doc.setTextColor(0, 0, 0);

                activities.slice(0, 15).forEach(activity => {
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.text(`Dia ${activity.day} - ${activity.time}: ${activity.title}`, 20, yPos);
                    yPos += 8;
                });
            }

            // Footer
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text('Gerado por PorAí - Seu companheiro de viagens', 20, 285);

            doc.save(`${trip.title.replace(/\s+/g, '_')}_roteiro.pdf`);
            showToast('PDF exportado com sucesso!', 'success');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            showToast('Erro ao exportar PDF', 'error');
        } finally {
            setIsExportingPdf(false);
        }
    }, [trip, tripStats, activities, showToast]);

    const handlePreview = useCallback(() => {
        window.open(`/preview/${trip.id}`, '_blank', 'noopener,noreferrer');
    }, [trip.id]);

    const handlePublish = useCallback(async () => {
        setIsPublishing(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // TODO: Implement actual API call
            // await shareService.updateTripPrivacy(trip.id, privacyMode === 'public');
            // await shareService.sendInvites(trip.id, invitedPeople.filter(p => p.status === 'Pendente'));

            showToast('Viagem publicada com sucesso!', 'success');
            onClose();
        } catch (error) {
            console.error('Error publishing:', error);
            showToast('Erro ao publicar viagem', 'error');
        } finally {
            setIsPublishing(false);
        }
    }, [privacyMode, showToast, onClose]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Compartilhar Viagem"
            size="xl"
        >
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-6 -mt-2">
                <p className="text-text-muted text-sm">
                    Mostre ao mundo suas aventuras e reviva seus melhores momentos.
                </p>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="text-sm px-4 py-2" onClick={handlePreview}>
                        <span className="material-symbols-outlined text-base mr-2">visibility</span>
                        Pré-visualizar
                    </Button>
                    <Button className="text-sm px-4 py-2" onClick={handlePublish} disabled={isPublishing}>
                        {isPublishing ? (
                            <span className="material-symbols-outlined text-base mr-2 animate-spin">refresh</span>
                        ) : (
                            <span className="material-symbols-outlined text-base mr-2">publish</span>
                        )}
                        Publicar Agora
                    </Button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column - Trip Preview (3 cols) */}
                <div className="lg:col-span-3 space-y-6">
                    <TripPreviewCard trip={trip} stats={tripStats} previewRef={previewCardRef} />

                    {/* About */}
                    <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
                        <h3 className="font-bold text-text-main mb-3">Sobre a viagem</h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                            Uma jornada inesquecível explorando {cities.length > 0 ? cities.map(c => c.name).join(', ') : 'destinos incríveis'}.
                            {trip.status === 'completed'
                                ? ' Coletamos memórias que durarão para sempre.'
                                : ' Estamos planejando uma aventura incrível.'}
                        </p>
                    </div>

                    <HighlightsCarousel highlights={highlights} />
                </div>

                {/* Right Column - Sharing Options (2 cols) */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Privacy */}
                    <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
                        <h3 className="font-bold text-text-main mb-4">Privacidade</h3>
                        <div className="space-y-3">
                            <PrivacyOption
                                isSelected={!isPrivate}
                                onClick={() => setPrivacyMode('public')}
                                icon="public"
                                title="Público"
                                description="Qualquer pessoa com o link pode visualizar sua viagem."
                            />
                            <PrivacyOption
                                isSelected={isPrivate}
                                onClick={() => setPrivacyMode('private')}
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
                                value={isPrivate ? '••••••••••••••••••••' : shareLink}
                                readOnly
                                disabled={isPrivate}
                                className={`flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm transition-all ${isPrivate
                                    ? 'text-gray-400 cursor-not-allowed opacity-60'
                                    : 'text-text-muted'
                                    }`}
                            />
                            <button
                                onClick={handleCopyLink}
                                disabled={isPrivate}
                                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${isPrivate
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : copiedLink
                                        ? 'bg-green-500 text-white'
                                        : 'bg-primary text-white hover:bg-primary-dark'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-base">
                                    {copiedLink ? 'check' : 'content_copy'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Social Share */}
                    <SocialShareButtons
                        shareLink={shareLink}
                        tripTitle={trip.title}
                        isDisabled={isPrivate}
                    />

                    {/* Invite People */}
                    <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/50">
                        <h3 className="font-bold text-text-main mb-3">Convidar Pessoas</h3>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => {
                                            setInviteEmail(e.target.value);
                                            setEmailError('');
                                        }}
                                        onKeyPress={handleKeyPress}
                                        placeholder="email@exemplo.com"
                                        fullWidth
                                        className={emailError ? 'border-rose-300 focus:border-rose-500' : ''}
                                    />
                                </div>
                                <button
                                    onClick={handleAddInvite}
                                    className="px-4 py-2.5 text-primary font-bold text-sm hover:bg-primary/5 rounded-xl transition-colors whitespace-nowrap"
                                >
                                    Adicionar
                                </button>
                            </div>
                            {emailError && (
                                <p className="text-xs text-rose-500 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">error</span>
                                    {emailError}
                                </p>
                            )}
                        </div>
                        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
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
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleExportPdf}
                            disabled={isExportingPdf}
                        >
                            {isExportingPdf ? (
                                <span className="material-symbols-outlined text-base mr-2 animate-spin">refresh</span>
                            ) : (
                                <span className="material-symbols-outlined text-base mr-2">picture_as_pdf</span>
                            )}
                            PDF
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleExportImage}
                            disabled={isExportingImage}
                        >
                            {isExportingImage ? (
                                <span className="material-symbols-outlined text-base mr-2 animate-spin">refresh</span>
                            ) : (
                                <span className="material-symbols-outlined text-base mr-2">image</span>
                            )}
                            Imagem
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ShareTripModal;
