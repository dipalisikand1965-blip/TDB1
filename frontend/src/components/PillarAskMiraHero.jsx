import React from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, Search, Sparkles } from 'lucide-react';

export const PillarAskMiraHero = ({
  title,
  description,
  value,
  onChange,
  onSubmit,
  loading = false,
  placeholder,
  badgeText = 'Ask Mira First',
  sectionTestId,
  inputTestId,
  submitTestId,
  badgeTestId,
  titleTestId,
  theme = 'pink',
  children,
}) => {
  const themeMap = {
    pink: {
      section: 'from-rose-50 via-pink-50 to-white',
      card: 'from-white via-pink-50 to-rose-50',
      border: 'border-pink-100',
      badge: 'from-pink-500 to-rose-500',
      inputBorder: 'border-pink-200',
      inputIcon: 'text-pink-400',
      button: 'from-pink-500 to-rose-500',
      shadow: 'shadow-[0_20px_60px_rgba(244,114,182,0.15)]',
    },
    teal: {
      section: 'from-teal-50 via-emerald-50 to-white',
      card: 'from-white via-teal-50 to-emerald-50',
      border: 'border-teal-100',
      badge: 'from-teal-500 to-emerald-500',
      inputBorder: 'border-teal-200',
      inputIcon: 'text-teal-400',
      button: 'from-teal-500 to-emerald-500',
      shadow: 'shadow-[0_20px_60px_rgba(20,184,166,0.15)]',
    },
    violet: {
      section: 'from-violet-50 via-fuchsia-50 to-white',
      card: 'from-white via-violet-50 to-fuchsia-50',
      border: 'border-violet-100',
      badge: 'from-violet-500 to-fuchsia-500',
      inputBorder: 'border-violet-200',
      inputIcon: 'text-violet-400',
      button: 'from-violet-500 to-fuchsia-500',
      shadow: 'shadow-[0_20px_60px_rgba(139,92,246,0.15)]',
    },
    amber: {
      section: 'from-amber-50 via-orange-50 to-white',
      card: 'from-white via-amber-50 to-orange-50',
      border: 'border-amber-100',
      badge: 'from-amber-500 to-orange-500',
      inputBorder: 'border-amber-200',
      inputIcon: 'text-amber-400',
      button: 'from-amber-500 to-orange-500',
      shadow: 'shadow-[0_20px_60px_rgba(245,158,11,0.15)]',
    },
  };

  const styles = themeMap[theme] || themeMap.pink;

  return (
    <section className={`px-4 py-8 bg-gradient-to-b ${styles.section}`} data-testid={sectionTestId}>
      <div className="max-w-5xl mx-auto">
        <div className={`rounded-[2rem] border ${styles.border} bg-gradient-to-r ${styles.card} p-6 md:p-8 ${styles.shadow}`}>
          <div className="text-center mb-5">
            <Badge className={`bg-gradient-to-r ${styles.badge} text-white px-4 py-1.5 mb-3`} data-testid={badgeTestId}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {badgeText}
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900" data-testid={titleTestId}>
              {title}
            </h1>
            {description && (
              <p className="text-sm md:text-base text-slate-600 mt-2 max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>

          {children ? <div className="mb-5">{children}</div> : null}

          <div className="max-w-3xl mx-auto">
            <div className={`flex gap-2 items-center bg-white rounded-full border-2 ${styles.inputBorder} shadow-sm p-1.5 pl-5`}>
              <Search className={`w-5 h-5 ${styles.inputIcon} flex-shrink-0`} />
              <Input
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="flex-1 border-0 focus-visible:ring-0 text-sm md:text-base placeholder:text-slate-400"
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                data-testid={inputTestId}
              />
              <Button
                onClick={onSubmit}
                disabled={loading || !value?.trim()}
                className={`rounded-full bg-gradient-to-r ${styles.button} hover:opacity-90 h-11 px-5 md:px-6 text-white`}
                data-testid={submitTestId}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" />Ask Mira</>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
