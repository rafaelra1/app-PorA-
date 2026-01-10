import * as React from 'react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge, PageContainer, PageHeader } from '../components/ui/Base';
import { EmptyState } from '../components/ui/EmptyState';

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

const Memories: React.FC = () => {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<JournalAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<JournalAlbum | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newPost, setNewPost] = useState('');
  const [location, setLocation] = useState('');

  const handleCreateAlbum = () => {
    // Placeholder for creating an album
    alert("Funcionalidade de criar álbum será implementada em breve.");
  };

  const handleCreatePost = () => {
    if (!newPost.trim()) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      author: {
        name: user?.name || 'Usuário',
        avatar: user?.avatar || 'https://ui-avatars.com/api/?name=User&background=667eea&color=fff'
      },
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

  const publishedAlbums = albums.filter(a => a.status === 'completed');
  const draftAlbums = albums.filter(a => a.status !== 'completed');

  const displayedAlbums = activeTab === 'published' ? publishedAlbums : draftAlbums;

  if (!selectedAlbum) {
    return (
      <PageContainer>
        <PageHeader
          title="Suas Memórias de Viagem"
          description="Álbum de lembranças de todas as suas aventuras. Reviva momentos especiais e compartilhe experiências."
          actions={
            <div className="flex bg-gray-100/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('published')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'published' ? 'bg-white text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                Galeria
              </button>
              <button
                onClick={() => setActiveTab('drafts')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'drafts' ? 'bg-white text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                Rascunhos
              </button>
            </div>
          }
        />

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
                    <Button variant="primary" className="h-10 px-5 text-xs font-bold uppercase">Continuar</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12">
            <EmptyState
              variant="illustrated"
              icon={activeTab === 'published' ? 'auto_stories' : 'edit_note'}
              title={activeTab === 'published' ? 'Seu diário está vazio' : 'Nenhum rascunho'}
              description={activeTab === 'published' ? 'Registre memórias das suas viagens' : 'Você não tem rascunhos em andamento.'}
              action={{
                label: "Criar Primeiro Álbum",
                onClick: handleCreateAlbum
              }}
            />
          </div>
        )}
      </PageContainer>
    );
  }

  // -- DETAIL VIEW (EXISTING FEED LOGIC) --
  return (
    <PageContainer className="max-w-3xl mx-auto">
      {/* Navigation Header */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => setSelectedAlbum(null)}
          className="size-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Memórias de Viagem</span>
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
          <img src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=667eea&color=fff'} className="size-8 rounded-lg object-cover" alt={user?.name || 'User'} />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-text-main leading-none">{user?.name || 'Usuário'}</span>
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
        {entries.length === 0 ? (
          <EmptyState
            variant="minimal"
            icon="notes"
            title="Nenhuma memória neste álbum"
            description="Comece a escrever sobre suas experiências!"
          />
        ) : (
          entries.map((entry) => (
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
                    <button
                      onClick={() => {
                        if (window.confirm('Excluir esta memória?')) {
                          setEntries(prev => prev.filter(e => e.id !== entry.id));
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-300 hover:text-rose-500 transition-colors"
                      title="Excluir"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                  <p className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                </div>
              </Card>
            </div>
          ))
        )}
      </div>
    </PageContainer>
  );
};

export default Memories;
