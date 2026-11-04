// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const documentsRoutes = require('./routes/documents.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/', documentsRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Rota não encontrada.'
    }
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'O arquivo excede o limite permitido.'
      }
    });
  }

  if (error.name === 'MulterError') {
    return res.status(400).json({
      error: {
        code: 'FILE_REQUIRED',
        message: 'Envie somente um arquivo no campo "file".'
      }
    });
  }

  if (['EACCES', 'ENOSPC', 'EIO'].includes(error.code)) {
    return res.status(500).json({
      error: {
        code: 'STORAGE_ERROR',
        message: 'Não foi possível acessar o armazenamento local.'
      }
    });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = status >= 500 ? 'Ocorreu um erro interno.' : error.message;

  return res.status(status).json({ error: { code, message } });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
