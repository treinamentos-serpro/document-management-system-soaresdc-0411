const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download de documentos', async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let uploadedId;

  try {
    const emptyListResponse = await fetch(`${baseUrl}/documents`);
    assert.equal(emptyListResponse.status, 200);
    assert.deepEqual(await emptyListResponse.json(), { documents: [] });

    const formData = new FormData();
    formData.append('file', new Blob(['conteudo de teste']), 'teste.txt');
    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: formData
    });
    assert.equal(uploadResponse.status, 201);

    const { document } = await uploadResponse.json();
    uploadedId = document.id;
    assert.equal(document.originalName, 'teste.txt');
    assert.equal(document.size, 17);
    assert.equal(document.owner, 'local-user');
    assert.equal(typeof document.storageKey, 'undefined');

    const listResponse = await fetch(`${baseUrl}/documents`);
    assert.equal(listResponse.status, 200);
    assert.deepEqual((await listResponse.json()).documents, [document]);

    const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
    assert.equal(downloadResponse.status, 200);
    assert.match(downloadResponse.headers.get('content-disposition'), /filename="teste.txt"/);
    assert.equal(await downloadResponse.text(), 'conteudo de teste');

    const missingResponse = await fetch(`${baseUrl}/documents/unknown/download`);
    assert.equal(missingResponse.status, 404);
    assert.equal((await missingResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');

    const missingFileResponse = await fetch(`${baseUrl}/upload`, { method: 'POST' });
    assert.equal(missingFileResponse.status, 400);
    assert.equal((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');
  } finally {
    if (uploadedId) {
      await fs.unlink(path.join(__dirname, '../storage', uploadedId)).catch(() => {});
    }
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
