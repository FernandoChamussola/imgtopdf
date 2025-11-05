'use client';

import { useState } from 'react';

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
      setMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!files || files.length === 0) {
      setMessage('Por favor, selecione pelo menos uma imagem!');
      return;
    }

    setLoading(true);
    setMessage('Convertendo imagens...');

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/convert`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao converter imagens');
      }

      // Download do PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage('✅ PDF criado com sucesso!');
      setFiles(null);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Erro:', error);
      setMessage('❌ Erro ao converter imagens. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📸 → 📄
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Conversor de Imagens para PDF
          </h2>
          <p className="text-gray-600">
            Envie suas imagens e converta para PDF instantaneamente!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <svg
                className="w-16 h-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-lg font-medium text-gray-700">
                Clique para selecionar imagens
              </span>
              <span className="text-sm text-gray-500 mt-2">
                PNG, JPG, JPEG ou WEBP
              </span>
            </label>
          </div>

          {files && files.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Imagens selecionadas: {files.length}
              </p>
              <ul className="space-y-1">
                {Array.from(files).map((file, index) => (
                  <li key={index} className="text-sm text-gray-600 truncate">
                    • {file.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !files}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '🔄 Convertendo...' : '🚀 Converter para PDF'}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-lg text-center font-medium ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-800' 
              : message.includes('❌')
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Desenvolvido com ❤️ usando Next.js + Node.js + Traefik</p>
        </div>
      </div>
    </main>
  );
}