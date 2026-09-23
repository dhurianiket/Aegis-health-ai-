import React from 'react';
import { useTurnstile } from '../../hooks/useTurnstile';

export interface TurnstileWidgetProps {
  action?: string;
  className?: string;
  onSuccess?: (token: string) => void;
  onError?: (err?: string) => void;
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  action = 'ai_generate',
  className = '',
  onSuccess,
  onError,
}) => {
  const { containerRef, error } = useTurnstile({
    action,
    onSuccess,
    onError,
  });

  return (
    <div className={`turnstile-widget-wrapper ${className}`}>
      <div ref={containerRef} className="min-h-[65px] flex items-center justify-center" />
      {error && (
        <p className="text-xs text-rose-400 mt-1 text-center" role="alert">
          Security verification check ({error}). Retrying...
        </p>
      )}
    </div>
  );
};

export default TurnstileWidget;
