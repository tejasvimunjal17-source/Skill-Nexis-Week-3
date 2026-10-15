import { useState } from 'react';
import { imageSrc } from '../api/client.js';
import { formatSize } from '../utils/format.js';

function ImageTile({ image }) {
  const [broken, setBroken] = useState(false);
  return (
    <li className="tile">
      {broken ? (
        <div className="broken">Image could not be loaded</div>
      ) : (
        <img src={imageSrc(image)} alt={image.originalName} loading="lazy" onError={() => setBroken(true)} />
      )}
      <p className="caption" title={image.originalName}>{image.originalName}</p>
      <p className="muted small">{formatSize(image.size)}</p>
    </li>
  );
}

export default function ImageGallery({ images, loading, error, onRetry }) {
  return (
    <section className="card">
      <h2>Uploaded images</h2>
      {error && (
        <p className="msg error" role="alert">
          {error} <button className="link" onClick={onRetry}>Try again</button>
        </p>
      )}
      {loading ? (
        <p className="center">Loading images...</p>
      ) : images.length === 0 && !error ? (
        <p className="center muted">No images yet. Upload your first one above.</p>
      ) : (
        <ul className="grid">
          {images.map((image) => (
            <ImageTile key={image.id} image={image} />
          ))}
        </ul>
      )}
    </section>
  );
}
