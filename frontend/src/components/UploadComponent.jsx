import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentsApi.js';

export function UploadComponent({ onUploaded }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleFileChange(event) {
    setSelectedFile(event.target.files?.[0] || null);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile || isUploading) {
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');
    try {
      const document = await uploadDocument(selectedFile);
      onUploaded(document);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSuccess('Documento enviado.');
    } catch (uploadError) {
      setError(uploadError.message || 'Não foi possível enviar o documento.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className={`file-picker${selectedFile ? ' has-file' : ''}`}>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <span className="picker-symbol" aria-hidden="true">+</span>
        <span className="picker-copy">
          <strong>{selectedFile ? 'Trocar documento' : 'Escolher documento'}</strong>
          <span>Selecione um arquivo no seu dispositivo</span>
        </span>
        <span className="picker-arrow" aria-hidden="true">↗</span>
      </label>

      {selectedFile && (
        <div className="selected-file" title={selectedFile.name}>
          <span className="selected-file-name">{selectedFile.name}</span>
          <span>{selectedFile.size.toLocaleString('pt-BR')} bytes</span>
        </div>
      )}

      <button className="primary-button upload-submit" type="submit" disabled={!selectedFile || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar arquivo'}
        {!isUploading && <span aria-hidden="true">↗</span>}
      </button>

      {error && <p className="feedback-message error-message" role="alert">{error}</p>}
      {success && <p className="feedback-message success-message" role="status">{success}</p>}
    </form>
  );
}