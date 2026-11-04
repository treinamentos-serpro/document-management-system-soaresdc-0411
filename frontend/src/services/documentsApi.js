const API_PREFIX = '/api';

async function throwApiError(response) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const error = new Error(payload?.error?.message || 'Não foi possível concluir a operação.');
  error.code = payload?.error?.code || 'REQUEST_FAILED';
  error.status = response.status;
  throw error;
}

export async function listDocuments() {
  const response = await fetch(`${API_PREFIX}/documents`);
  if (!response.ok) {
    await throwApiError(response);
  }

  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_PREFIX}/upload`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    await throwApiError(response);
  }

  const payload = await response.json();
  return payload.document;
}

function getDownloadFilename(contentDisposition, fallback) {
  const encodedName = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encodedName) {
    try {
      return decodeURIComponent(encodedName.replace(/^"|"$/g, ''));
    } catch {
      return fallback;
    }
  }

  const plainName = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1];
  return plainName || fallback;
}

export async function downloadDocument(document) {
  const response = await fetch(
    `${API_PREFIX}/documents/${encodeURIComponent(document.id)}/download`
  );
  if (!response.ok) {
    await throwApiError(response);
  }

  return {
    blob: await response.blob(),
    filename: getDownloadFilename(
      response.headers.get('Content-Disposition') || '',
      document.originalName
    )
  };
}