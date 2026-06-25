import { typography, colors } from '../../styles/tokens';

interface SectionLabelProps {
  number?: string;
  text: string;
}

export default function SectionLabel({ number, text }: SectionLabelProps) {
  return (
    <div style={{
      ...typography.sectionLabel,
      marginBottom: '24px',
      color: colors.warmGray,
    }}>
      {number && <span>{number} — </span>}
      {text}
    </div>
  );
}
