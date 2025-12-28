/**
 * Core testing interfaces and types
 */

export type TestCategory = 'unit' | 'integration' | 'property' | 'performance' | 'security';
export type TestPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Base test case interface
 */
export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  priority: TestPriority;
  tags: string[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  timeout?: number;
}

/**
 * Property test interface
 */
export interface PropertyTest extends TestCase {
  property: (input: any) => boolean | Promise<boolean>;
  generator: () => any;
  iterations?: number;
  shrinkingEnabled?: boolean;
}

/**
 * Unit test interface
 */
export interface UnitTest extends TestCase {
  test: () => Promise<TestResult> | TestResult;
}

/**
 * Integration test interface
 */
export interface IntegrationTest extends TestCase {
  test: () => Promise<TestResult>;
  dependencies: string[];
  environment: 'development' | 'staging' | 'production';
}

/**
 * Test result interface
 */
export interface TestResult {
  testId: string;
  success: boolean;
  executionTime: number;
  error?: Error;
  metadata?: Record<string, any>;
  iterations?: number;
  counterExample?: any;
  coverage?: TestCoverage;
}

/**
 * Test coverage interface
 */
export interface TestCoverage {
  linesTotal: number;
  linesCovered: number;
  functionsTotal: number;
  functionsCovered: number;
  branchesTotal: number;
  branchesCovered: number;
  percentage: number;
}

/**
 * Test suite interface
 */
export interface TestSuite {
  name: string;
  description: string;
  tests: (PropertyTest | UnitTest | IntegrationTest)[];
  beforeAll?: () => Promise<void>;
  afterAll?: () => Promise<void>;
  beforeEach?: () => Promise<void>;
  afterEach?: () => Promise<void>;
}

/**
 * Test execution report
 */
export interface TestReport {
  suiteId: string;
  suiteName: string;
  startTime: Date;
  endTime: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalExecutionTime: number;
  results: TestResult[];
  coverage?: TestCoverage;
  summary: {
    successRate: number;
    averageExecutionTime: number;
    criticalFailures: number;
    performanceIssues: number;
  };
}