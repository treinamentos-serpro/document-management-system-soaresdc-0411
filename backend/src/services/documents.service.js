const documentsRepository = require('../repositories/documents.repository');

const DEMO_OWNER = 'local-user';

function createError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function toPublicDocument(document) {
  const { storageKey, ...publicDocument } = document;
  return publicDocument;
}

async function upload(file) {
  if (!file || file.size === 0) {
    if (file) {
      await documentsRepository.removeFile(file.filename);
    }
    throw createError(400, 'FILE_REQUIRED', 'Envie um arquivo não vazio no campo "file".');
  }

  const document = {
    id: file.filename,
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: DEMO_OWNER,
    storageKey: file.filename
  };

  try {
    await documentsRepository.save(document);
    return toPublicDocument(document);
  } catch (error) {
    await documentsRepository.removeFile(file.filename);
    throw createError(500, 'STORAGE_ERROR', 'Não foi possível registrar o documento.');
  }
}

async function list() {
  const documents = await documentsRepository.findByOwner(DEMO_OWNER);
  return documents.map(toPublicDocument);
}

async function getDownload(id) {
  const document = await documentsRepository.findById(id);
  if (!document) {
    throw createError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  try {
    const filePath = await documentsRepository.getFilePath(document.storageKey);
    return { document: toPublicDocument(document), filePath };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw createError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }
    throw createError(500, 'STORAGE_ERROR', 'Não foi possível ler o documento.');
  }
}

module.exports = { upload, list, getDownload };