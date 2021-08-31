export enum Severity {
  INFO = 'info',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface InputOptions {
  cwd?: string;
  yarn?: boolean;
  level?: Severity;
  dependencyType?: 'devDependencies' | 'dependencies';
  command?: string;
}

export interface FilterOptions {
  packageName: string;
  packageSeverity?: string;
}

export interface OutputOptions {
  allow?: string[] | ((options: FilterOptions) => boolean);
}
