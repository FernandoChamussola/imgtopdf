const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configurar multer para upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'));
    }
  }
});

// Criar pastas se não existirem
const initFolders = async () => {
  await fs.mkdir('./uploads', { recursive: true });
  await fs.mkdir('./output', { recursive: true });
};

initFolders();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Image to PDF Converter API is running!' });
});

// Upload e conversão de imagens para PDF
app.post('/api/convert', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada!' });
    }

    console.log(`📸 Recebidas ${req.files.length} imagens para conversão`);

    // Criar PDF
    const pdfDoc = await PDFDocument.create();

    // Processar cada imagem
    for (const file of req.files) {
      console.log(`🔄 Processando: ${file.originalname}`);

      // Converter imagem para PNG usando sharp
      const imageBuffer = await sharp(file.path)
        .png()
        .toBuffer();

      // Adicionar ao PDF
      const pngImage = await pdfDoc.embedPng(imageBuffer);
      const { width, height } = pngImage.scale(1);

      // Criar página com tamanho da imagem
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width,
        height,
      });

      // Remover arquivo temporário
      await fs.unlink(file.path);
    }

    // Salvar PDF
    const pdfBytes = await pdfDoc.save();
    const pdfFilename = `converted-${Date.now()}.pdf`;
    const pdfPath = path.join('./output', pdfFilename);

    await fs.writeFile(pdfPath, pdfBytes);

    console.log(`✅ PDF criado: ${pdfFilename}`);

    // Enviar PDF para download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
    res.sendFile(path.resolve(pdfPath), async (err) => {
      if (!err) {
        // Remover arquivo após envio
        setTimeout(async () => {
          try {
            await fs.unlink(pdfPath);
            console.log(`🗑️ Arquivo limpo: ${pdfFilename}`);
          } catch (e) {}
        }, 5000);
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ error: 'Erro ao processar imagens', details: error.message });
  }
});

// Estatísticas
app.get('/api/stats', async (req, res) => {
  try {
    const uploadsFiles = await fs.readdir('./uploads');
    const outputFiles = await fs.readdir('./output');
    
    res.json({
      uploadsCount: uploadsFiles.length,
      outputCount: outputFiles.length
    });
  } catch (error) {
    res.json({ uploadsCount: 0, outputCount: 0 });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});