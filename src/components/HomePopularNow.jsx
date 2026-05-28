import { Link } from 'react-router-dom';
import { getHomePopularSections } from '../data/homePopularNow';

export default function HomePopularNow() {
  const sections = getHomePopularSections();

  return (
    <div className="home-popular-now">
      {sections.map((section) => (
        <section
          key={section.id}
          className="home-popular-now__section"
          aria-labelledby={`home-popular-${section.id}`}
        >
          <div className="home-popular-now__head">
            <h2 id={`home-popular-${section.id}`}>{section.title}</h2>
            {section.subtitle ? <p>{section.subtitle}</p> : null}
          </div>
          <ul className="home-popular-now__grid" role="list">
            {section.items.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="home-popular-now__card">
                  <strong>{item.label}</strong>
                  {item.hint ? <span>{item.hint}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
