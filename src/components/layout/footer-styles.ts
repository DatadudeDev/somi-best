import { colors, fonts, fontWeights } from '../../styles/tokens';

/**
 * Footer CSS, extracted verbatim from Footer.tsx. Token values interpolate at
 * module load, so the produced string is byte-identical to the inline original.
 */
export const FOOTER_CSS = `
        .scf-inner {
          padding: clamp(40px, 8vw, 64px) clamp(16px, 4vw, 24px) 32px;
          text-align: left;
        }
        .scf-main {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: clamp(28px, 5vw, 52px);
          align-items: start;
          margin-bottom: 48px;
          width: 100%;
        }
        .scf-brand {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 100%;
        }
        /* Lockup: left column on desktop; type left-aligned inside fit-content box. */
        .scf-lockup {
          margin: 0 0 16px;
          width: fit-content;
          max-width: 100%;
          text-align: left;
        }
        .scf-tagline {
          margin: 0;
          max-width: 280px;
          font-family: ${fonts.body};
          font-weight: ${fontWeights.light};
          font-size: 14px;
          letter-spacing: 0.04em;
          line-height: 1.5;
          color: ${colors.warmGray};
          text-align: left;
        }
        .scf-nav {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: flex-start;
          justify-content: flex-end;
          gap: clamp(28px, 4vw, 56px);
          width: auto;
        }
        /* Column as a centered block; copy stays left-aligned inside the block. */
        .scf-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: left;
          width: fit-content;
          max-width: 100%;
          min-width: 0;
        }
        .scf-title {
          margin: 0 0 16px;
          font-family: ${fonts.body};
          font-weight: ${fontWeights.medium};
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          line-height: 1;
          color: ${colors.cream};
        }
        .scf-list {
          list-style: none;
          margin: 0;
          padding: 0;
          text-align: left;
        }
        /* Uniform vertical spacing: only between list rows (same for every row). */
        .scf-list > li + li {
          margin-top: 0.55em;
        }
        .scf-line,
        .scf-list a.scf-line {
          display: block;
          margin: 0;
          padding: 0;
          font-family: ${fonts.body};
          font-weight: ${fontWeights.light};
          font-size: 14px;
          letter-spacing: 0.04em;
          line-height: 1.35;
          color: ${colors.warmGray};
          text-decoration: none;
        }
        .scf-list a.scf-line:hover {
          color: ${colors.creamText};
        }
        .scf-maps-link {
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .scf-list a.scf-maps-link:hover {
          color: ${colors.sageGreen};
        }
        .scf-tel {
          white-space: nowrap;
        }
        .scf-icons {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
          gap: 16px;
          line-height: 0;
        }
        .scf-icons a {
          display: inline-flex;
          color: ${colors.warmGray};
          line-height: 0;
          transition: color 0.2s;
        }
        .scf-icons a:hover {
          color: ${colors.creamText};
        }
        .scf-legal-row {
          border-top: 1px solid ${colors.deepSage};
          padding-top: 24px;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          text-align: left;
        }
        .scf-copy {
          margin: 0;
          font-family: ${fonts.body};
          font-weight: ${fontWeights.light};
          font-size: 12px;
          letter-spacing: 0.04em;
          line-height: 1.4;
          color: ${colors.warmGray};
          max-width: 36rem;
          text-align: left;
        }
        .scf-legal-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 24px;
        }
        .scf-legal-links a {
          font-family: ${fonts.body};
          font-weight: ${fontWeights.light};
          font-size: 12px;
          letter-spacing: 0.04em;
          line-height: 1.4;
          color: ${colors.warmGray};
          text-decoration: none;
        }
        .scf-legal-links a:hover {
          color: ${colors.creamText};
        }

        @media (max-width: 768px) {
          .scf-inner {
            padding: 22px 16px 14px;
            text-align: center;
          }
          .scf-main {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 24px;
            margin-bottom: 20px;
          }
          .scf-brand {
            align-items: center;
            width: 100%;
          }
          .scf-lockup {
            margin: 0 auto 0;
          }
          .scf-tagline {
            display: none;
          }
          .scf-nav {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 14px;
            justify-content: center;
            justify-items: center;
            width: 100%;
            max-width: 420px;
            margin-inline: auto;
            text-align: left;
          }
          .scf-title {
            margin: 0 0 10px;
            font-size: 12px;
          }
          .scf-icons {
            justify-content: flex-start;
          }
          .scf-line,
          .scf-list a.scf-line {
            font-size: 14px;
            line-height: 1.35;
          }
          .scf-list > li + li {
            margin-top: 0.5em;
          }
          .scf-legal-row {
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding-top: 16px;
            gap: 10px;
            text-align: center;
          }
          .scf-copy {
            text-align: center;
          }
          .scf-legal-links {
            justify-content: center;
            gap: 16px;
          }
        }
      `;
