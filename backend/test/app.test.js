const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('endpoints de documentos', async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let uploadedId;

  try {
    await t.test('GET /documents retorna uma lista inicialmente vazia', async () => {
      const response = await fetch(`${baseUrl}/documents`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { documents: [] });
    });

    await t.test('POST /upload grava e retorna os metadados públicos', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['conteudo de teste']), 'teste.txt');
      const response = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        body: formData
      });
      assert.equal(response.status, 201);

      const { document } = await response.json();
      uploadedId = document.id;
      assert.equal(document.originalName, 'teste.txt');
      assert.equal(document.size, 17);
      assert.equal(document.owner, 'local-user');
      assert.equal(typeof document.storageKey, 'undefined');
    });

    await t.test('GET /documents lista os metadados do documento enviado', async () => {
      const response = await fetch(`${baseUrl}/documents`);
      assert.equal(response.status, 200);
      const { documents } = await response.json();
      assert.equal(documents.length, 1);
      assert.equal(documents[0].id, uploadedId);
      assert.equal(documents[0].originalName, 'teste.txt');
    });

    await t.test('GET /documents/:id/download retorna o arquivo enviado', async () => {
      const response = await fetch(`${baseUrl}/documents/${uploadedId}/download`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-disposition'), /filename="teste.txt"/);
      assert.equal(await response.text(), 'conteudo de teste');
    });

    await t.test('GET /documents/:id/download retorna 404 para ID inexistente', async () => {
      const response = await fetch(`${baseUrl}/documents/unknown/download`);
      assert.equal(response.status, 404);
      assert.equal((await response.json()).error.code, 'DOCUMENT_NOT_FOUND');
    });

    await t.test('POST /upload rejeita requisição sem arquivo', async () => {
      const response = await fetch(`${baseUrl}/upload`, { method: 'POST' });
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, 'FILE_REQUIRED');
    });

    await t.test('POST /upload rejeita arquivo vazio', async () => {
      const formData = new FormData();
      formData.append('file', new Blob([]), 'vazio.txt');
      const response = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        body: formData
      });
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, 'FILE_REQUIRED');
    });
  } finally {
    if (uploadedId) {
      await fs.unlink(path.join(__dirname, '../storage', uploadedId)).catch(() => {});
    }
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
