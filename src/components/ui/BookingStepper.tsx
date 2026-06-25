import { colors, fonts } from '../../styles/tokens';

interface BookingStepperProps {
  currentStep: number; // 1 = Service (done), 2 = Schedule, 3 = Checkout
}

const steps = [
  { num: 1, label: 'Service' },
  { num: 2, label: 'Schedule' },
  { num: 3, label: 'Checkout' },
];

export default function BookingStepper({ currentStep }: BookingStepperProps) {
  return (
    <>
      <style>{`
        .book-stepper-label {
          font-family: ${fonts.body};
          font-size: 14px;
          font-weight: 400;
          letter-spacing: 0.01em;
        }
        .book-stepper-label--active { font-weight: 500; }
        .book-stepper-connector {
          width: 60px;
          height: 1.5px;
          margin: 0 16px;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .book-stepper-label { display: none; }
          .book-stepper-connector { width: 20px; margin: 0 8px; }
        }
      `}</style>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0',
        padding: '24px 0',
      }}>
        {steps.map((step, i) => {
          const isComplete = step.num < currentStep;
          const isActive = step.num === currentStep;
          const isPending = step.num > currentStep;

          return (
            <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
              {/* Step circle + label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontFamily: fonts.body,
                  fontWeight: 500,
                  flexShrink: 0,
                  background: isComplete ? colors.sageGreen : isActive ? colors.sageGreen : 'transparent',
                  color: isComplete || isActive ? colors.cream : colors.warmGray,
                  border: isPending ? `1.5px solid ${colors.stone}` : 'none',
                }}>
                  {isComplete ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7L5.5 10L11.5 4" stroke={colors.cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : step.num}
                </div>
                <span
                  className={`book-stepper-label${isActive ? ' book-stepper-label--active' : ''}`}
                  style={{ color: isPending ? colors.warmGray : colors.charcoal }}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className="book-stepper-connector"
                  style={{
                    background: step.num < currentStep ? colors.sageGreen : colors.stone,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
