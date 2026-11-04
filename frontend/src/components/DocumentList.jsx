import { DownloadButton } from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} KB`;
  }
  return `${(size / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
}

function formatUploadedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function DocumentList({ documents, isLoading, isRefreshing, error, onRefresh }) {
  return (
    <>
      <div className="library-heading">
        <div className="panel-heading">
          <span className="section-index">02</span>
          <h2 id="documents-heading">Biblioteca</h2>
        </div>
        <button
          className="text-button refresh-button"
          type="button"
          onClick={onRefresh}
          disabled={isLoading || isRefreshing}
        >
          {isRefreshing ? 'Atualizando...' : 'Atualizar lista'}
        </button>
      </div>

      {error && (
        <div className="list-feedback error-message" role="alert">
          <span>{error}</span>
          <button className="text-button" type="button" onClick={onRefresh}>Tentar novamente</button>
        </div>
      )}

      {isLoading ? (
        <p className="list-state" role="status">Carregando documentos...</p>
      ) : error && documents.length === 0 ? null : documents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-index" aria-hidden="true">00</span>
          <p>Nenhum documento enviado ainda.</p>
        </div>
      ) : (
        <ul className="document-list">
          {documents.map((document) => (
            <li className="document-row" key={document.id}>
              <span className="file-type-mark" aria-hidden="true">DOC</span>
              <div className="document-details">
                <h3 title={document.originalName}>{document.originalName}</h3>
                <p>
                  <span>{formatFileSize(document.size)}</span>
                  <span className="metadata-separator" aria-hidden="true">/</span>
                  <time dateTime={document.uploadedAt}>{formatUploadedAt(document.uploadedAt)}</time>
                </p>
              </div>
              <DownloadButton document={document} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}