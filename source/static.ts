export interface InputOptions {
  cwd?: string;
  yarn?: boolean;
  level?: 'info' | 'low' | 'moderate' | 'high' | 'critical';
  dependencyType?: 'devDependencies' | 'dependencies';
  command?: string;
}

export interface OutputOptions {
  allow?: string[];
}
