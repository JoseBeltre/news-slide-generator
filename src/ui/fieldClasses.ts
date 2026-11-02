// Aspecto común de los controles de formulario (DESIGN.md → Campos): un solo lugar para
// UiInput, UiTextarea y UiSelect.
export const FIELD_CLASS = [
  'w-full rounded-sm border border-field-border bg-surface px-3 text-base text-ink placeholder:text-ink-muted',
  'focus-visible:border-2 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
  'aria-invalid:border-2 aria-invalid:border-danger disabled:bg-muted',
].join(' ')
