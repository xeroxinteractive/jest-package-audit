import { Severity, InputOptions } from '../static';

const severityCascade: string[] = [
  Severity.INFO,
  Severity.LOW,
  Severity.MODERATE,
  Severity.HIGH,
  Severity.CRITICAL,
];

/**
 * Checks if a severity is greater than the configured one.
 *
 * @param inputOptions - Options for running the audit.
 * @param severity - The severity to check.
 * @returns Whether the severity is in range.
 */
export default function severityGreater(
  inputOptions: InputOptions,
  severity?: string
): boolean {
  // If no level was specified, or the current severity does not exist or
  // we are using npm with info: include the severity.
  if (!inputOptions.level || !severity) {
    return true;
  }
  const minimumIndex = severityCascade.indexOf(inputOptions.level);
  const currentIndex = severityCascade.indexOf(severity);
  // If for some reason we cannot find the index, include the severity.
  if (minimumIndex === -1 || currentIndex === -1) {
    return true;
  }
  return currentIndex >= minimumIndex;
}
