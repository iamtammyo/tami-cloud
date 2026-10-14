/**
 * Headlines mark their script accent word with underscores:
 * "Two videos, one _guardrail_" renders "guardrail" in Mrs Saint Delafield.
 */
export function splitScript(text: string) {
  return text.split(/_(.+?)_/).map((part, i) => ({ text: part, script: i % 2 === 1 }));
}

export const plainText = (text: string) => text.replace(/_(.+?)_/g, '$1');
