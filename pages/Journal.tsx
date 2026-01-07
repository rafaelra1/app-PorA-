import React, { useState } from 'react';
import { DEMO_USER } from '../constants';
import { Card, Button, Badge } from '../components/ui/Base';

interface JournalAlbum {
  id: string;
  title: string;
  cover: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'draft';
  entriesCount: number;
  description: string;
}

const DEMO_ALBUMS: JournalAlbum[] = [
  {
    id: '1',
    title: 'Aventura no Japão',
    cover: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&q=80&w=1000',
    startDate: '2023-10-05',
    endDate: '2023-10-20',
    status: 'completed',
    entriesCount: 12,
    description: 'Templos, sushi e muita caminhada em Tokyo e Kyoto.'
  },
  {
    id: '2',
    title: 'Verão Europeu',
    cover: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=1000',
    startDate: '2024-07-15',
    status: 'active',
    entriesCount: 5,
    description: 'Explorando a Costa Amalfitana e as ilhas gregas.'
  },
  {
    id: '3',
    title: 'Escapada Serra Gaúcha',
    cover: 'https://images.unsplash.com/photo-1613564993170-c75080ee279d?auto=format&fit=crop&q=80&w=1000',
    startDate: '2023-05-10',
    endDate: '2023-05-15',
    status: 'draft',
    entriesCount: 0,
    description: 'Vinhos e frio em Gramado.'
  }
];

// Reusing existing interfaces for detail view
export interface JournalEntry {
  id: string;
  author: { name: string; avatar: string };
  timestamp: string;
  date: string;
  location: string;
  content: string;
  images?: string[];
  tags: string[];
  likes: number;
  comments: number;
}

const DEMO_ENTRIES: JournalEntry[] = [
  {
    id: 'e1',
    author: DEMO_USER,
    timestamp: '10:30',
    date: '2023-10-06',
    location: 'Senso-ji Temple, Tokyo',
    content: 'A energia deste lugar é inexplicável. O cheiro de incenso logo pela manhã traz uma paz que eu não esperava encontrar no meio de uma metrópole tão caótica.',
    images: ['https://images.unsplash.com/photo-1596724859878-838634594c48?auto=format&fit=crop&q=80&w=800'],
    tags: ['Tokyo', 'Espiritualidade'],
    likes: 24,
    comments: 3
  }
];

const Journal: React.FC = () => {
  const [selectedAlbum, setSelectedAlbum] = useState<JournalAlbum | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>(DEMO_ENTRIES);
  const [newPost, setNewPost] = useState('');
  const [location, setLocation] = useState('');

  const handleCreatePost = () => {
    if (!newPost.trim()) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      author: DEMO_USER,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      location: location || 'Local Desconhecido',
      content: newPost,
      likes: 0,
      comments: 0,
      tags: []
    };
    setEntries([entry, ...entries]);
    setNewPost('');
    setLocation('');
  };

  // -- REPOSITORY VIEW (ALBUMS) --
  const [activeTab, setActiveTab] = useState<'published' | 'drafts'>('published');

  const publishedAlbums = DEMO_ALBUMS.filter(a => a.status === 'completed');
  const draftAlbums = DEMO_ALBUMS.filter(a => a.status !== 'completed');

  const displayedAlbums = activeTab === 'published' ? publishedAlbums : draftAlbums;

  if (!selectedAlbum) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col gap-10 pb-20 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
          <div>
            <h2 className="text-3xl font-black text-text-main tracking-tight">Acervo de Viagens</h2>
            <p className="text-text-muted text-sm font-medium mt-2 max-w-xl">
              Sua coleção de roteiros finalizados. Transforme suas experiências em guias prontos para compartilhar ou revisitar.
            </p>
          </div>

          <div className="flex bg-gray-100/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('published')}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'published' ? 'bg-white text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
            >
              Publicados
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'drafts' ? 'bg-white text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
            >
              Rascunhos
            </button>
          </div>
        </div>

        {displayedAlbums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedAlbums.map(album => (
              <div
                key={album.id}
                onClick={() => setSelectedAlbum(album)}
                className="group cursor-pointer flex flex-col gap-4"
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm shadow-gray-200 group-hover:shadow-2xl group-hover:shadow-primary/20 transition-all duration-500">
                  <img src={album.cover} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={album.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 transition-opacity" />

                  <div className="absolute top-4 right-4">
                    {album.status === 'completed' && <Badge variant="neutral" className="bg-white/20 text-white backdrop-blur-md border-none">Publicado</Badge>}
                    {album.status !== 'completed' && <Badge variant="outline" className="bg-black/40 text-white border-white/20 backdrop-blur-sm">Editando</Badge>}
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 text-white text-center">
                    <h3 className="text-2xl font-black tracking-tight mb-2 font-serif italic">{album.title}</h3>
                    <div className="h-px w-12 bg-white/50 mx-auto my-3" />
                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-80">
                      <span>{new Date(album.startDate).getFullYear()}</span>
                      <span>•</span>
                      <span>{album.entriesCount} Caps.</span>
                    </div>
                  </div>
                </div>

                {activeTab === 'drafts' && (
                  <div className="flex justify-between items-center px-2">
                    <span className="text-xs text-text-muted font-bold">Última edição: há 2 dias</span>
                    <Button variant="primary" className="h-8 px-4 text-[10px] uppercase">Continuar</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
            <div className="size-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-gray-300">
              <span className="material-symbols-outlined text-3xl">{activeTab === 'published' ? 'auto_stories' : 'edit_note'}</span>
            </div>
            <p className="text-text-muted font-bold text-sm">
              {activeTab === 'published'
                ? 'Nenhum diário publicado ainda.'
                : 'Você não tem rascunhos em andamento.'}
            </p>
          </div>
        )}
      </div>
    );
  }

  // -- DETAIL VIEW (EXISTING FEED LOGIC) --
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-20 animate-in fade-in duration-500">
      {/* Navigation Header */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => setSelectedAlbum(null)}
          className="size-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Diário de Viagem</span>
          <h2 className="text-2xl font-black text-text-main leading-none mt-1">{selectedAlbum.title}</h2>
        </div>
        <Button variant="outline" className="text-xs h-9">
          <span className="material-symbols-outlined text-base mr-2">ios_share</span>
          Compartilhar
        </Button>
      </div>

      {/* New Entry Form */}
      <Card className="p-0 border-none shadow-soft overflow-hidden group">
        <div className="flex items-center gap-3 p-4 bg-gray-50/50 border-b border-gray-100">
          <img src={DEMO_USER.avatar} className="size-8 rounded-lg object-cover" alt={DEMO_USER.name} />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-text-main leading-none">{DEMO_USER.name}</span>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Nova Memória em {selectedAlbum.title}</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="O que você está sentindo agora? Descreva cores, aromas e sons..."
            className="w-full min-h-[100px] text-base text-text-main bg-transparent border-none focus:ring-0 p-0 resize-none placeholder:text-gray-300 font-medium leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-50 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">location_on</span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Localização..."
                  className="w-full bg-gray-50 border-none rounded-lg pl-9 pr-4 py-2 text-xs font-bold focus:ring-1 focus:ring-primary/50 text-text-main"
                />
              </div>
              <button className="size-9 rounded-lg bg-gray-50 text-text-muted flex items-center justify-center hover:bg-primary/20 hover:text-text-main transition-all">
                <span className="material-symbols-outlined text-lg">add_a_photo</span>
              </button>
            </div>

            <Button
              onClick={handleCreatePost}
              disabled={!newPost.trim()}
              variant="dark"
              className="!bg-[#111111] !py-2.5 !px-6 !text-[11px] font-extrabold uppercase tracking-[0.15em] w-full sm:w-auto shadow-xl shadow-black/10"
            >
              Postar
            </Button>
          </div>
        </div>
      </Card>

      {/* Feed */}
      <div className="flex flex-col gap-8">
        {entries.map((entry) => (
          <div key={entry.id} className="relative text-left animate-in slide-in-from-bottom-4 duration-700">
            <div className="absolute -left-12 top-0 bottom-0 hidden lg:flex flex-col items-center">
              <div className="size-8 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center text-[10px] font-black text-primary shadow-sm z-10">
                {new Date(entry.date).getDate()}
              </div>
              <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent my-2" />
            </div>

            <Card className="overflow-hidden border-none shadow-soft hover:shadow-xl transition-all duration-500 rounded-xl">
              {entry.images && entry.images.length > 0 && (
                <div className="relative aspect-video overflow-hidden">
                  <img src={entry.images[0]} className="w-full h-full object-cover" alt="Post" />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-400">{entry.timestamp} • {entry.location}</span>
                </div>
                <p className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">{entry.content}</p>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Journal;
