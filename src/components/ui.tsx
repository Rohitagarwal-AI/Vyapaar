import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { AlertCircle, Inbox, X } from 'lucide-react';

export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md';
  }
>) {
  return (
    <button className={cx('button', `button-${variant}`, `button-${size}`, className)} {...props}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <section className={cx('card', className)}>{children}</section>;
}

export function Badge({
  children,
  tone = 'slate',
}: PropsWithChildren<{ tone?: 'slate' | 'green' | 'amber' | 'red' | 'blue' | 'violet' }>) {
  return <span className={cx('badge', `badge-${tone}`)}>{children}</span>;
}

export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: PropsWithChildren<{ title: string; subtitle?: string; onClose: () => void; wide?: boolean }>) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className={cx('modal', wide && 'modal-wide')}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span>{eyebrow}</span>}
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}

export function EmptyState({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span><Inbox size={20} /></span>
      <h3>{title}</h3>
      <p>{copy}</p>
      {action}
    </div>
  );
}

export function FormField({
  label,
  children,
  hint,
}: PropsWithChildren<{ label: string; hint?: string }>) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function ErrorBanner({ children }: PropsWithChildren) {
  return <div className="error-banner"><AlertCircle size={16} />{children}</div>;
}
