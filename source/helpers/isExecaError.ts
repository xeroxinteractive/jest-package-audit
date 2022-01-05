import { ExecaError } from 'execa';

/**
 * Type guard for Execa Errors.
 *
 * @param error - Error from catch.
 * @returns Whether the given error is an ExecaError.
 */
export default function isExecaError(error: unknown): error is ExecaError {
  const execaError = error as ExecaError;
  return (
    'isCanceled' in execaError &&
    'failed' in execaError &&
    'killed' in execaError
  );
}
