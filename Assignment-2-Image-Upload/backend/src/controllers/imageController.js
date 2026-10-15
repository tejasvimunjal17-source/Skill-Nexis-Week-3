// Controllers hold the logic for each API route.
const Image = require('../models/Image');
const asyncHandler = require('../middleware/asyncHandler');
const { detectImageType } = require('../utils/imageSignature');
const { sanitizeFilename } = require('../utils/sanitizeFilename');
const { FIELD_NAME, LIST_LIMIT } = require('../config/upload');

// What we send back about an image. The picture bytes are never included here.
const formatImage = (image) => ({
  id: image._id,
  originalName: image.originalName,
  mimeType: image.mimeType,
  size: image.size,
  createdAt: image.createdAt,
  url: `/api/images/${image._id}/file`, // the address the browser uses to show the picture
});

// POST /api/images  -> upload one image (form field "image")
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: `No image received. Send one file in the form field named "${FIELD_NAME}"`,
    });
  }

  // Check what the file REALLY is, not what the browser says it is.
  const realType = detectImageType(req.file.buffer);
  if (!realType) {
    return res.status(400).json({
      success: false,
      message: 'This file is not a valid JPEG, PNG, GIF or WebP image',
    });
  }

  const image = await Image.create({
    originalName: sanitizeFilename(req.file.originalname),
    mimeType: realType, // we store the detected type, never the claimed one
    size: req.file.size,
    data: req.file.buffer,
  });

  res.status(201).json({
    success: true,
    message: 'Image uploaded successfully',
    data: formatImage(image),
  });
});

// GET /api/images  -> list uploaded images (newest first, no picture data)
const listImages = asyncHandler(async (req, res) => {
  const images = await Image.find().select('-data').sort({ createdAt: -1 }).limit(LIST_LIMIT);
  res.status(200).json({
    success: true,
    count: images.length,
    data: images.map(formatImage),
  });
});

// GET /api/images/:id/file  -> the picture itself (used as <img src="...">)
const getImageFile = asyncHandler(async (req, res) => {
  const image = await Image.findById(req.params.id).select('+data');
  if (!image) {
    return res.status(404).json({ success: false, message: 'Image not found' });
  }

  res.set({
    'Content-Type': image.mimeType,
    'X-Content-Type-Options': 'nosniff', // browser must not guess a different type
    'Cache-Control': 'public, max-age=31536000, immutable', // an image never changes once saved
  });
  res.status(200).send(Buffer.from(image.data));
});

module.exports = { uploadImage, listImages, getImageFile, formatImage };
