import { useEffect, useState } from 'react';
import { DocumentList } from './components/DocumentList.jsx';
import { UploadComponent } from './components/UploadComponent.jsx';
import { listDocuments } from './services/documentsApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listError, setListError] = useState('');

  useEffect(() => {
    let isActive = true;

    listDocuments()
      .then((items) => {
        if (isActive) {
          setDocuments(items);
          setListError('');
        }
      })
      .catch((error) => {
        if (isActive) {
          setListError(error.message || 'Não foi possível carregar os documentos.');
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function refreshDocuments() {
    setIsRefreshing(true);
    try {
      setDocuments(await listDocuments());
      setListError('');
    } catch (error) {
      setListError(error.message || 'Não foi possível carregar os documentos.');
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleUploaded(document) {
    setDocuments((currentDocuments) => [
      document,
      ...currentDocuments.filter((item) => item.id !== document.id)
    ]);
    setListError('');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-name">ARQUIVO<span> / DMS</span></span>
        </a>
        <div className="account-label">
          <span className="account-dot" aria-hidden="true" />
          <span>USUÁRIO DEMO</span>
        </div>
      </header>

      <section className="page-heading" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">ESPAÇO DE DOCUMENTOS</p>
          <h1 id="page-title">Seus arquivos,<br />em ordem.</h1>
          <p className="page-subtitle">Documentos enviados para o armazenamento local.</p>
        </div>
        <div className="document-total" aria-live="polite">
          <span className="total-number">{documents.length.toString().padStart(2, '0')}</span>
          <span className="total-label">{documents.length === 1 ? 'DOCUMENTO' : 'DOCUMENTOS'}</span>
        </div>
      </section>

      <div className="workspace-grid">
        <aside className="upload-panel" aria-labelledby="upload-heading">
          <div className="panel-heading">
            <span className="section-index">01</span>
            <h2 id="upload-heading">Adicionar arquivo</h2>
          </div>
          <UploadComponent onUploaded={handleUploaded} />
        </aside>

        <section className="library-panel" aria-labelledby="documents-heading">
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            error={listError}
            onRefresh={refreshDocuments}
          />
        </section>
      </div>

      <footer className="page-footer">
        <span>DOCUMENT MANAGEMENT SYSTEM</span>
        <span>ARMAZENAMENTO LOCAL</span>
      </footer>
    </main>
  );
}