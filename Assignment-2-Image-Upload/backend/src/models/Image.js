// An uploaded image. The picture itself (the bytes) is stored in MongoDB, so it is not lost
// when a hosting service restarts the server (free hosting often erases local files).
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, trim: true, maxlength: 100 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }, // bytes
    // select: false means list queries do not load the heavy picture data.
    data: { type: Buffer, required: true, select: false },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model('Image', imageSchema);
