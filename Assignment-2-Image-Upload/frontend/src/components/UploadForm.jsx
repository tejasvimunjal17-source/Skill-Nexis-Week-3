import { useEffect, useRef, useState } from 'react';
import { uploadImage, getErrorMessage } from '../api/client.js';
import { ACCEPT_ATTRIBUTE, MAX_FILE_SIZE_MB, validateFile } from '../utils/validateFile.js';
import { formatSize } from '../utils/format.js';

export default function UploadForm({ onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Free the temporary preview address when it is replaced or the page closes.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearSelection = () => {
    setFile(null);
    setPreviewUrl('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleChange = (e) => {
    setSuccess('');
    setError('');
    setProgress(0);
    const chosen = e.target.files?.[0];
    if (!chosen) return clearSelection();

    const problem = validateFile(chosen);
    if (problem) {
      clearSelection();
      setError(problem);
      return;
    }
    setFile(chosen);
    setPreviewUrl(URL.createObjectURL(chosen)); // instant preview, nothing is sent yet
  };

  const handleUpload = async () => {
    setError('');
    setSuccess('');
    const problem = validateFile(file);
    if (problem) return setError(problem);

    setUploading(true);
    setProgress(0);
    try {
      const { data } = await uploadImage(file, setProgress);
      onUploaded(data.data);
      setSuccess('Image uploaded successfully.');
      clearSelection();
      setProgress(0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="card">
      <h2>Upload an image</h2>
      <p className="muted small">
        JPEG, PNG, GIF or WebP, up to {MAX_FILE_SIZE_MB} MB.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        onChange={handleChange}
        disabled={uploading}
        aria-label="Choose an image"
      />

      {error && <p className="msg error" role="alert">{error}</p>}
      {success && <p className="msg success" role="status">{success}</p>}

      {previewUrl && (
        <div className="preview">
          <img src={previewUrl} alt="Preview of the chosen file" />
          <p className="small">{file.name} ({formatSize(file.size)})</p>
        </div>
      )}

      {uploading && (
        <div className="progress" aria-label="Upload progress">
          <div className="bar" style={{ width: `${progress}%` }} />
          <span className="small">{progress}%</span>
        </div>
      )}

      <button className="btn" onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </section>
  );
}
