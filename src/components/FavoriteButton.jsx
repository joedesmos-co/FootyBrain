export default function FavoriteButton({ className = '', itemName, onToggle, saved }) {
  return (
    <button
      type="button"
      className={`btn btn--secondary favorite-button ${saved ? 'favorite-button--saved' : ''} ${className}`}
      onClick={onToggle}
      aria-pressed={saved}
      title={saved ? `Remove ${itemName} from saved` : `Save ${itemName} to learn`}
    >
      {saved ? 'Saved' : 'Save to Learn'}
      <span className="sr-only"> {itemName}</span>
    </button>
  );
}
