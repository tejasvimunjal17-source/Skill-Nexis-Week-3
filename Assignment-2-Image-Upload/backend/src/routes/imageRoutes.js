// Connects URLs + HTTP methods to controller functions.
const express = require('express');
const { uploadImage, listImages, getImageFile } = require('../controllers/imageController');
const uploadMiddleware = require('../middleware/uploadImage');
const { validateObjectId } = require('../middleware/validateObjectId');

const router = express.Router();

router.route('/').get(listImages).post(uploadMiddleware, uploadImage);
router.get('/:id/file', validateObjectId, getImageFile);

module.exports = router;
