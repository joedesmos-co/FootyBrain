import { Link } from 'react-router-dom';
import { DATASET_META } from '../data/datasetMeta';

export default function HomeTrustStrip() {
  return (
    <aside className="home-trust-strip" aria-label="Trust and transparency">
      <ul className="home-trust-strip__list">
        <li>
          <span className="home-trust-strip__label">Updated</span>
          <span>Updated {DATASET_META.dataAsOf}</span>
        </li>
        <li>
          <span className="home-trust-strip__label">Account</span>
          <span>No sign-up — progress stays on your device</span>
        </li>
        <li>
          <span className="home-trust-strip__label">Editorial</span>
          <Link to="/editorial">How we source &amp; correct data</Link>
        </li>
        <li>
          <span className="home-trust-strip__label">About</span>
          <Link to="/about">Who runs FootyCompass</Link>
        </li>
      </ul>
    </aside>
  );
}
