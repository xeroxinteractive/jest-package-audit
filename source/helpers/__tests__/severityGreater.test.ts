import severityGreater from '../severityGreater';
import { Severity } from '../../static';

test('equal', () => {
  expect(severityGreater({ level: Severity.LOW }, Severity.LOW)).toBe(true);
});

test('greater', () => {
  expect(severityGreater({ level: Severity.LOW }, Severity.HIGH)).toBe(true);
});

test('less', () => {
  expect(severityGreater({ level: Severity.CRITICAL }, Severity.MODERATE)).toBe(
    false
  );
});

test('invalid severity', () => {
  expect(severityGreater({ level: Severity.INFO }, 'invalid')).toBe(true);
});
