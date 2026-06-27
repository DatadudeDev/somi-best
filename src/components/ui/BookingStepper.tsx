import { colors, fonts } from '../../styles/tokens';

interface BookingStepperProps {
  currentStep: number; // 1 = Service (done), 2 = Schedule, 3 = Checkout
  onStepClick?: (stepNum: number) => void;
  canGoToCheckout?: boolean;
}

const steps = [
  { num: 1, label: 'Service' },
  { num: 2, label: 'Schedule' },
  { num: 3, label: 'Checkout' },
];

export default function BookingStepper({ currentStep, onStepClick, canGoToCheckout = false }: BookingStepperProps) {
  const isClickable = (stepNum: number): boolean => {
    if (!onStepClick) return false;
    if (stepNum === currentStep) return stepNum <= 2;
    if (stepNum < currentStep) return true;
    if (stepNum === 3) return canGoToCheckout;
    return false;
  };

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
        .book-stepper-hit {
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
          background: transparent;
          padding: 4px 0;
          cursor: default;
          font: inherit;
          text-align: left;
        }
        .book-stepper-hit--clickable {
          cursor: pointer;
        }
        .book-stepper-hit--clickable:hover .book-stepper-label {
          color: ${colors.sageGreen};
        }
        @media (max-width: 768px) {
          .book-stepper-label { display: none; }
          .book-stepper-connector { width: 20px; margin: 0 8px; }
        }
      `}</style>
      <nav
        aria-label="Booking progress"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0',
          padding: '24px 0',
        }}
      >
        {steps.map((step, i) => {
          const isComplete = step.num < currentStep;
          const isActive = step.num === currentStep;
          const isPending = step.num > currentStep;
          const clickable = isClickable(step.num);

          return (
            <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                className={`book-stepper-hit${clickable ? ' book-stepper-hit--clickable' : ''}`}
                disabled={!clickable}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => clickable && onStepClick?.(step.num)}
              >
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
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
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
              </button>

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
      </nav>
    </>
  );
}
