
import * as React from 'react';
import { useState, useMemo } from 'react';
import { Card, Button, Badge, PageContainer, PageHeader, FilterBar, FilterButton } from '../components/ui/Base';
import { useTrips } from '../contexts/TripContext';
import { getGeminiService } from '../services/geminiService';

interface UserDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc';
  category: 'Voucher' | 'Passaporte' | 'Seguro' | 'Outros';
  date: string;
  size: string;
  trip?: string;
  tripId?: string;
  fileData?: string;
}

const DEMO_DOCS: UserDocument[] = [];

const Library: React.FC = () => {
  const { trips } = useTrips();
  const [filter, setFilter] = useState('Tudo');
  const [search, setSearch] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [pendingScan, setPendingScan] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'by-trip'>('all');

  // Group documents by trip
  const documentsByTrip = useMemo(() => {
    const grouped: Record<string, UserDocument[]> = {};
    documents.forEach(doc => {
      const tripKey = doc.tripId || 'global';
      if (!grouped[tripKey]) grouped[tripKey] = [];
      grouped[tripKey].push(doc);
    });
    return grouped;
  }, [documents]);

  const categories = ['Tudo', 'Voucher', 'Passaporte', 'Seguro', 'Outros'];

  const filteredDocs = documents.filter(doc => {
    const matchesFilter = filter === 'Tudo' || doc.category === filter;
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return 'picture_as_pdf';
      case 'image': return 'image';
      case 'doc': return 'description';
      default: return 'insert_drive_file';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleUploadClick = (withScan = false) => {
    setPendingScan(withScan);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      const fileType = file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'doc';
      const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';

      const newDoc: UserDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: fileType as any,
        category: 'Outros', // Default
        date: new Date().toLocaleDateString('pt-BR'),
        size: fileSize,
        fileData: base64
      };

      setDocuments(prev => [newDoc, ...prev]);

      if (pendingScan) {
        analyzeDocument(newDoc);
      }
    } catch (error) {
      console.error('Error reading file:', error);
    }

    // Reset input
    if (event.target) event.target.value = '';
    setPendingScan(false);
  };

  const analyzeDocument = async (doc: UserDocument) => {
    if (!doc.fileData) return;

    setIsAnalyzing(true);
    try {
      const service = getGeminiService();
      const results = await service.analyzeDocumentImage(doc.fileData);

      if (results && results.length > 0) {
        const result = results[0];

        let category: UserDocument['category'] = 'Outros';
        if (result.type === 'flight' || result.type === 'hotel' || result.type === 'activity') category = 'Voucher';
        if (result.type === 'insurance') category = 'Seguro';
        if (result.name?.toLowerCase().includes('passport') || result.name?.toLowerCase().includes('passaporte')) category = 'Passaporte';

        setDocuments(prev => prev.map(d => d.id === doc.id ? {
          ...d,
          category,
          trip: result.name || result.type,
          date: result.date
            ? new Date(result.date).toLocaleDateString('pt-BR')
            : d.date
        } : d));
      }
    } catch (error) {
      console.error('Analysis failed', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSmartScan = () => {
    handleUploadClick(true);
  };

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    setActiveMenuId(null);
  };

  const handleDownload = (doc: UserDocument) => {
    if (!doc.fileData) return;

    // Create download link
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (doc: UserDocument) => {
    if (!doc.fileData) return;

    // Open in new window
    const win = window.open();
    if (win) {
      if (doc.type === 'pdf') {
        win.document.write(`<iframe src="${doc.fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        win.document.write(`<img src="${doc.fileData}" style="max-width:100%"/>`);
      }
    }
  };

  return (
    <PageContainer>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />

      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>Biblioteca de Documentos</span>
            <Badge variant="neutral" className="text-[10px] font-bold">🌐 Repositório Global</Badge>
          </div>
        }
        description="Seu repositório central de arquivos importantes. Documentos específicos de viagens são salvos automaticamente aqui."
        actions={
          <>
            <Button variant="outline" className="h-10 px-4 text-xs font-bold uppercase tracking-wide border-gray-200 hover:border-primary hover:text-primary">
              <span className="material-symbols-outlined text-lg mr-2">sync</span>
              Sincronizar
            </Button>
            <Button
              variant="primary"
              className="h-10 px-5 text-xs font-bold uppercase tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40"
              onClick={() => handleUploadClick(false)}
            >
              <span className="material-symbols-outlined text-sm mr-1">cloud_upload</span>
              Upload
            </Button>
          </>
        }
      />

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* Left Column: Filters & Grid */}
        <div className="flex-1 w-full space-y-6">
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar documentos..."
          >
            {categories.map(cat => (
              <FilterButton
                key={cat}
                isActive={filter === cat}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </FilterButton>
            ))}
          </FilterBar>

          {/* Documents Grid */}
          {filteredDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredDocs.map((doc) => (
                <Card key={doc.id} className="p-0 border border-gray-100 shadow-soft hover:shadow-lg transition-shadow group overflow-hidden flex flex-col h-full rounded-2xl bg-white hover:border-primary/30">
                  <div className="p-6 bg-gray-50/50 flex items-center justify-center h-40 relative group-hover:bg-primary/5 transition-colors">
                    <div className={`size-16 rounded-2xl flex items-center justify-center bg-white shadow-sm ${doc.type === 'pdf' ? 'text-rose-500' : doc.type === 'image' ? 'text-blue-500' : 'text-primary'
                      }`}>
                      <span className="material-symbols-outlined text-3xl">
                        {getIcon(doc.type)}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 rounded-md bg-white border border-gray-100 text-[10px] font-bold text-text-muted shadow-sm">
                        {doc.size}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2 relative">
                      <h5 className="font-bold text-sm text-text-main truncate pr-2 group-hover:text-primary transition-colors" title={doc.name}>
                        {doc.name}
                      </h5>
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                          className="text-gray-300 hover:text-text-main transition-colors p-1 rounded-full hover:bg-gray-100"
                        >
                          <span className="material-symbols-outlined text-lg">more_vert</span>
                        </button>

                        {activeMenuId === doc.id && (
                          <div className="absolute right-0 top-8 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-48 animate-in fade-in zoom-in-95 duration-200">
                            <button
                              onClick={() => handleView(doc)}
                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-text-muted hover:bg-gray-50 flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-base">visibility</span>
                              Visualizar Arquivo
                            </button>
                            <button
                              onClick={() => handleDownload(doc)}
                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-text-muted hover:bg-gray-50 flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-base">download</span>
                              Baixar
                            </button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                              Excluir da Lista
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-text-muted font-medium flex items-center gap-1.5 mb-3">
                      <span className="material-symbols-outlined text-xs">calendar_today</span>
                      {doc.date}
                    </p>

                    {doc.trip && (
                      <div className="mt-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-100 text-text-muted rounded-lg max-w-full">
                        <span className="material-symbols-outlined text-xs shrink-0">luggage</span>
                        <span className="text-[10px] font-bold truncate">{doc.trip}</span>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2">
                      <button
                        onClick={() => handleView(doc)}
                        className="flex-1 bg-white border border-gray-200 text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        Visualizar
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="size-9 bg-white border border-gray-200 text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5 rounded-xl flex items-center justify-center transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">download</span>
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
              <div className="size-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <span className="material-symbols-outlined text-4xl text-gray-300">folder_open</span>
              </div>
              <h3 className="text-lg font-bold text-text-main mb-1">Nenhum documento</h3>
              <p className="text-text-muted text-sm max-w-xs mx-auto mb-6">
                Faça upload dos seus vouchers e passaportes para acessá-los facilmente durante a viagem.
              </p>
              <Button
                variant="primary"
                className="h-10 px-5 text-xs font-bold shadow-lg shadow-primary/20"
                onClick={() => handleUploadClick(false)}
              >
                Upload de Arquivo
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: AI & Stats */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          {/* AI Smart Scan Card */}
          <Card className="bg-gradient-to-br from-primary to-primary-dark p-6 border-none shadow-soft hover:shadow-lg transition-shadow relative overflow-hidden group rounded-2xl">
            <div className="relative z-10">
              <div className="size-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-4">
                <span className={`material-symbols-outlined text-2xl ${isAnalyzing ? 'animate-spin' : ''}`}>auto_awesome</span>
              </div>

              <h4 className="font-black text-xl text-white mb-2">Smart Scan IA</h4>
              <p className="text-white/80 text-sm font-medium mb-6 leading-relaxed">
                Nossa IA analisa seus PDFs para identificar datas, locais e n° de reservas automaticamente.
              </p>

              <button
                onClick={handleSmartScan}
                disabled={isAnalyzing}
                className="w-full bg-white text-primary px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-all active:scale-95 shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">document_scanner</span>
                    Iniciar Scan
                  </>
                )}
              </button>
            </div>

            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 size-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute -bottom-10 -left-10 size-40 bg-black/10 rounded-full blur-3xl"></div>
          </Card>

          {/* Storage Stats */}
          <Card className="p-5 border border-gray-100 shadow-soft rounded-2xl bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">cloud_done</span>
              </div>
              <div>
                <h6 className="text-sm font-bold text-text-main">Armazenamento</h6>
                <p className="text-xs text-text-muted">Criptografia ponta-a-ponta</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-text-main">0 GB</span>
                <span className="text-text-muted">10 GB</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[0%] transition-all duration-500" />
              </div>
              <p className="text-[10px] text-text-muted text-center pt-1">
                Seus documentos estão seguros e offline.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default Library;


