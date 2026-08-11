import React from 'react';
import { validatePassword } from '../utils/passwordValidator';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PasswordRequirementsChecklistProps {
  password: string;
  className?: string;
}

export const PasswordRequirementsChecklist: React.FC<PasswordRequirementsChecklistProps> = ({
  password,
  className = ''
}) => {
  const result = validatePassword(password);

  const criteriaList = [
    { label: 'At least 6 figures/characters', pass: result.hasMinLength },
    { label: 'Capital letter (A-Z)', pass: result.hasUpper },
    { label: 'Small letter (a-z)', pass: result.hasLower },
    { label: 'Number digit (0-9)', pass: result.hasNumber },
    { label: 'Special character (!@#$%^&*)', pass: result.hasSpecial },
  ];

  if (!password) {
    return (
      <div className={`p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 ${className}`}>
        <div className="font-semibold text-slate-300 mb-1">Password Complexity Rules:</div>
        <div className="grid grid-cols-2 gap-1 font-mono">
          {criteriaList.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
              <span>{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-2.5 bg-slate-950/90 rounded-xl border ${result.isValid ? 'border-emerald-800/80 bg-emerald-950/30' : 'border-amber-700/60 bg-amber-950/30'} text-[11px] transition ${className}`}>
      <div className="font-bold flex items-center justify-between mb-1.5">
        <span className={result.isValid ? 'text-emerald-400' : 'text-amber-300'}>
          {result.isValid ? '✓ Password Meets All Security Rules' : '⚠️ Password Requirements Checklist:'}
        </span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${result.isValid ? 'bg-emerald-900/80 text-emerald-300' : 'bg-amber-900/80 text-amber-200'}`}>
          {result.isValid ? 'STRONG' : 'INCOMPLETE'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono text-[10px]">
        {criteriaList.map((c, i) => (
          <div key={i} className={`flex items-center gap-1.5 ${c.pass ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
            {c.pass ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span className={c.pass ? 'text-emerald-300' : 'text-slate-400'}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
