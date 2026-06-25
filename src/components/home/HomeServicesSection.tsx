import { useState } from 'react';
import { Link } from 'react-router-dom';
import { site } from '../../config/site';
import {
  HOME_SERVICE_TIERS,
  formatServiceMinutes,
  serviceBookPath,
} from '../../data/pricing';
import { HOME_CLEANING_SECTION_ID } from '../../lib/home-services-nav';
import AnimatedSection from '../ui/AnimatedSection';
import '../../styles/services-pricing.css';

const DEFAULT_SELECTED = 'Premium';

export default function HomeServicesSection() {
  const [selected, setSelected] = useState(DEFAULT_SELECTED);

  return (
    <section id={HOME_CLEANING_SECTION_ID} className="services-pricing">
      <AnimatedSection>
        <div className="services-pricing__head">
          <div className="services-pricing__eyebrow">{site.services.sectionLabel}</div>
          <h2 className="services-pricing__title">{site.services.headline}</h2>
          <p className="services-pricing__lede">{site.services.subheadline}</p>
        </div>

        <div className="services-pricing__grid" role="list">
          {HOME_SERVICE_TIERS.map(tier => {
            const isSelected = selected === tier.name;
            return (
              <article
                key={tier.pkg}
                role="listitem"
                className={`services-pricing__card${isSelected ? ' is-selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => setSelected(tier.name)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(tier.name);
                  }
                }}
                tabIndex={0}
              >
                {tier.popular && <span className="services-pricing__ribbon">Popular</span>}
                <h3 className="services-pricing__name">{tier.name}</h3>
                <div className="services-pricing__price-row">
                  <span className="services-pricing__price">${tier.price}</span>
                  <span className="services-pricing__per">/ visit</span>
                </div>
                <p className="services-pricing__dur">{formatServiceMinutes(tier.minutes)}</p>
                <ul className="services-pricing__features">
                  {tier.features.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link
                  className="services-pricing__book"
                  to={serviceBookPath(tier.pkg)}
                  onClick={e => e.stopPropagation()}
                >
                  Book Now
                </Link>
              </article>
            );
          })}
        </div>
      </AnimatedSection>
    </section>
  );
}
