const documentsRepository = require('../repositories/documents.repository');

const DEMO_OWNER = 'local-user';

function createError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function createNotFoundError() {
  return createError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
}

function createFileRequiredError() {
  return createError(400, 'FILE_REQUIRED', 'Envie um arquivo não vazio no campo "file".');
}

function createStorageError(action) {
  return createError(500, 'STORAGE_ERROR', `Não foi possível ${action} o documento.`);
}

function toPublicDocument(document) {
  const { storageKey, ...publicDocument } = document;
  return publicDocument;
}

async function validateUploadedFile(file) {
  if (!file) {
    throw createFileRequiredError();
  }

  if (file.size === 0) {
    await documentsRepository.removeFile(file.filename);
    throw createFileRequiredError();
  }
}

function createDocumentMetadata(file) {
  return {
    id: file.filename,
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: DEMO_OWNER,
    storageKey: file.filename
  };
}

async function persistDocument(document) {
  try {
    await documentsRepository.save(document);
  } catch {
    await documentsRepository.removeFile(document.storageKey);
    throw createStorageError('registrar');
  }
}

async function findDocument(id) {
  const document = await documentsRepository.findById(id);
  if (!document) {
    throw createNotFoundError();
  }
  return document;
}

async function resolveFilePath(document) {
  try {
    return await documentsRepository.getFilePath(document.storageKey);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw createNotFoundError();
    }
    throw createStorageError('ler');
  }
}

async function upload(file) {
  await validateUploadedFile(file);

  const document = createDocumentMetadata(file);
  await persistDocument(document);
  return toPublicDocument(document);
}

async function list() {
  const documents = await documentsRepository.findByOwner(DEMO_OWNER);
  return documents.map(toPublicDocument);
}

async function getDownload(id) {
  const document = await findDocument(id);
  const filePath = await resolveFilePath(document);
  return { document: toPublicDocument(document), filePath };
}

module.exports = { upload, list, getDownload };