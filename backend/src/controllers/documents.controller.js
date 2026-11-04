const documentsService = require('../services/documents.service');

async function upload(req, res, next) {
  try {
    const document = await documentsService.upload(req.file);
    return res.status(201).json({ document });
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const documents = await documentsService.list();
    return res.status(200).json({ documents });
  } catch (error) {
    return next(error);
  }
}

async function download(req, res, next) {
  try {
    const { document, filePath } = await documentsService.getDownload(req.params.id);
    res.type('application/octet-stream');
    return res.download(filePath, document.originalName, (error) => {
      if (error) {
        next(error);
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { upload, list, download };