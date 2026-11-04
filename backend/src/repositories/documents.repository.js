const fs = require('node:fs/promises');
const path = require('node:path');

const storageDirectory = path.resolve(__dirname, '../../storage');
const documents = new Map();

async function save(document) {
  documents.set(document.id, document);
}

async function findByOwner(owner) {
  return Array.from(documents.values())
    .filter((document) => document.owner === owner)
    .sort((first, second) => {
      const dateOrder = second.uploadedAt.localeCompare(first.uploadedAt);
      return dateOrder || first.id.localeCompare(second.id);
    });
}

async function findById(id) {
  return documents.get(id);
}

async function getFilePath(storageKey) {
  if (!storageKey || path.basename(storageKey) !== storageKey) {
    const error = new Error('Chave de armazenamento inválida.');
    error.code = 'EINVAL';
    throw error;
  }

  const filePath = path.join(storageDirectory, storageKey);
  await fs.access(filePath);
  return filePath;
}

async function removeFile(storageKey) {
  if (!storageKey || path.basename(storageKey) !== storageKey) {
    return;
  }

  try {
    await fs.unlink(path.join(storageDirectory, storageKey));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = { save, findByOwner, findById, getFilePath, removeFile };