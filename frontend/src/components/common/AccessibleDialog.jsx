import { useEffect, useRef } from 'react';

// Focus-trap helper shared by both the shell and the date-picker variant.
export function trapFocus(event) {
  if (event.key !== 'Tab') return;
  const controls = [...event.currentTarget.querySelectorAll(
    'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])',
  )].filter(el => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');
  const first = controls[0];
  const last = controls.at(-1);
  if (!first) { event.preventDefault(); return; }
  if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === event.currentTarget)) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * AccessibleDialog — single dialog primitive for the whole app.
 *
 * Props:
 *   open            boolean          Whether the dialog is visible.
 *   onClose         () => void       Called on Escape or backdrop click.
 *   labelledBy      string           id of the element that names the dialog.
 *   describedBy     string           id of the element that describes it.
 *   noLabel         boolean          Explicit opt-out of aria-labelledby (rare; add a comment at call site).
 *   noBackdropClose boolean          Disables close-on-backdrop click (destructive flows).
 *   initialFocusRef React ref        Element to focus on open (defaults to first focusable control).
 *   dialogClassName string           Extra classes on the <dialog> element itself.
 *   className       string           Classes on the inner content wrapper <div>.
 *   children        ReactNode
 *
 * Size is controlled by className on the inner div (max-w-sm, max-w-lg, etc.).
 * Sheet / navigation dialogs pass dialogClassName="navigation-dialog".
 */
export default function AccessibleDialog({
  open = true,
  onClose,
  labelledBy,
  describedBy,
  noLabel = false,
  noBackdropClose = false,
  initialFocusRef,
  className = '',
  dialogClassName = '',
  children,
}) {
  const dialog = useRef(null);

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';

    // Move focus: prefer explicit ref, then first focusable control, then dialog itself.
    const target = initialFocusRef?.current;
    if (target) {
      target.focus({ preventScroll: true });
    } else {
      const first = element.querySelector(
        'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      (first ?? element).focus({ preventScroll: true });
    }

    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialog}
      aria-modal="true"
      aria-labelledby={noLabel ? undefined : labelledBy}
      aria-describedby={describedBy}
      className={`accessible-dialog ${dialogClassName}`}
      onKeyDown={trapFocus}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (!noBackdropClose && event.target === event.currentTarget) onClose();
      }}
    >
      <div className={className}>{children}</div>
    </dialog>
  );
}
