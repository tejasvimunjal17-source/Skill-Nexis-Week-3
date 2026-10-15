import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="card center">
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link to="/tasks">Go to my tasks</Link>
    </div>
  );
}
