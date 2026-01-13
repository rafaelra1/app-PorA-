import React from 'react';
import DocumentUploader from '../components/DocumentUploader';
import { ArrowLeft } from 'lucide-react';

const DocumentProcessingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <header className="sticky top-0 z-10 backdrop-blur-lg bg-black/30 border-b border-white/10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
                    <a href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </a>
                    <div>
                        <h1 className="text-white font-semibold">Processamento de Documentos</h1>
                        <p className="text-gray-400 text-sm">Extraia dados de passagens, hotéis e mais</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-2">
                        🤖 Extração Inteligente com IA
                    </h2>
                    <p className="text-gray-300">
                        Carregue seus documentos de viagem (PDF ou imagem) e nossa IA irá extrair
                        automaticamente todas as informações importantes como voos, reservas de hotel,
                        aluguel de carro e muito mais.
                    </p>
                </div>

                <DocumentUploader
                    onDataExtracted={(data) => {
                        console.log('Extracted data:', data);
                    }}
                />

                {/* Info Cards */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-2xl mb-2">📄</div>
                        <h3 className="text-white font-medium mb-1">PDFs</h3>
                        <p className="text-gray-400 text-sm">
                            E-tickets, e-mails de confirmação, comprovantes
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-2xl mb-2">🖼️</div>
                        <h3 className="text-white font-medium mb-1">Imagens</h3>
                        <p className="text-gray-400 text-sm">
                            Screenshots, fotos de documentos, cartões de embarque
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-2xl mb-2">✅</div>
                        <h3 className="text-white font-medium mb-1">Validação</h3>
                        <p className="text-gray-400 text-sm">
                            Verificamos datas, códigos IATA e formatos automaticamente
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DocumentProcessingPage;
