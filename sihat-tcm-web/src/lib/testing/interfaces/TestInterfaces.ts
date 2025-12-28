/**
 * Testing Framework Interfaces
 * 
 * Comprehensive interfaces for the advanced testing framework with
 * property-based testing, test generation, and analytics.
 */

/**
 * Base test interface that all tests must implement
 */
export interface BaseTest {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: TestCategory;
  readonly priority: TestPriority;
  readonly tags: string[];
  readonly timeout?: number;
  readonly metadata?: TestMetadata;
  
  // Lifecycle hooks
  setup?(): Promise<void>;
  teardown?(): Promise<void>;
}

/**
 * Test categories for organization
 */
export type TestCategory = 'unit' | 'integration' | 'property' | 'performance' | 'security' | 'e2e';

/**
 * Test priority levels
 */
export type TestPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Test metadata for additional context
 */
export interface TestMetadata {
  author?: string;
  createdAt?: Date;
  lastModified?: Date;
  version?: string;
  requirements?: string[];
  dependencies?: string[];
  environment?: string[];
}

/**
 * Property-based test interface
 */
export interface PropertyTest extends BaseTest {
  category: 'property';
  property: PropertyFunction;
  generator: DataGenerator;
  iterations?: number;
  shrinkingEnabled?: boolean;
  shrinkingStrategy?: ShrinkingStrategy;
  precondition?: PredicateFunction;
  postcondition?: PredicateFunction;
}

/**
 * Property function that defines the invariant to test
 */
export type PropertyFunction<T = any> = (input: T) => boolean | Promise<boolean>;

/**
 * Data generator function
 */
export type DataGenerator<T = any> = () => T;

/**
 * Predicate function for conditions
 */
export type PredicateFunction<T = any> = (input: T) => boolean;

/**
 * Shrinking strategies for counterexample minimization
 */
export type ShrinkingStrategy = 'aggressive' | 'conservative' | 'smart' | 'none';

/**
 * Unit test interface
 */
export interface UnitTest extends BaseTest {
  category: 'unit';
  test: TestFunction;
  expectedResult?: any;
  assertions?: AssertionFunction[];
}

/**
 * Test function
 */
export type TestFunction = () => Promise<TestResult> | TestResult | Promise<void> | void;

/**
 * Assertion function
 */
export type AssertionFunction = (result: any) => boolean | Promise<boolean>;

/**
 * Integration test interface
 */
export interface IntegrationTest extends BaseTest {
  category: 'integration';
  test: TestFunction;
  dependencies: string[];
  environment: TestEnvironment;
  dataSetup?: DataSetupFunction;
  dataCleanup?: DataCleanupFunction;
}

/**
 * Test environment specification
 */
export interface TestEnvironment {
  name: string;
  requirements: EnvironmentRequirement[];
  configuration: Record<string, any>;
}

/**
 * Environment requirement
 */
export interface EnvironmentRequirement {
  type: 'service' | 'database' | 'api' | 'file' | 'network';
  name: string;
  version?: string;
  configuration?: Record<string, any>;
}

/**
 * Data setup function
 */
export type DataSetupFunction = () => Promise<any>;

/**
 * Data cleanup function
 */
export type DataCleanupFunction = (setupData: any) => Promise<void>;

/**
 * Performance test interface
 */
export interface PerformanceTest extends BaseTest {
  category: 'performance';
  test: TestFunction;
  performanceTargets: PerformanceTargets;
  loadProfile?: LoadProfile;
  warmupIterations?: number;
  measurementIterations?: number;
}

/**
 * Performance targets
 */
export interface PerformanceTargets {
  maxExecutionTime?: number;
  maxMemoryUsage?: number;
  minThroughput?: number;
  maxErrorRate?: number;
  percentileTargets?: PercentileTarget[];
}

/**
 * Percentile target
 */
export interface PercentileTarget {
  percentile: number; // e.g., 95 for 95th percentile
  maxValue: number;
}

/**
 * Load profile for performance testing
 */
export interface LoadProfile {
  concurrentUsers: number;
  rampUpTime: number;
  sustainTime: number;
  rampDownTime: number;
}

/**
 * Test execution result
 */
export interface TestResult {
  testId: string;
  success: boolean;
  executionTime: number;
  error?: Error;
  metadata?: Record<string, any>;
  
  // Property test specific
  iterations?: number;
  counterExample?: any;
  shrinkingSteps?: number;
  
  // Performance test specific
  performanceMetrics?: PerformanceMetrics;
  
  // Coverage information
  coverage?: TestCoverage;
  
  // Assertions
  assertions?: AssertionResult[];
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  throughput: number;
  errorRate: number;
  percentiles: Record<number, number>;
  resourceUtilization: ResourceUtilization;
}

/**
 * Resource utilization metrics
 */
export interface ResourceUtilization {
  cpu: number;
  memory: number;
  network: number;
  disk: number;
}

/**
 * Test coverage information
 */
export interface TestCoverage {
  linesTotal: number;
  linesCovered: number;
  functionsTotal: number;
  functionsCovered: number;
  branchesTotal: number;
  branchesCovered: number;
  statementsTotal: number;
  statementsCovered: number;
  percentage: number;
}

/**
 * Assertion result
 */
export interface AssertionResult {
  description: string;
  passed: boolean;
  expected?: any;
  actual?: any;
  error?: string;
}

/**
 * Test suite interface
 */
export interface TestSuite {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tests: BaseTest[];
  readonly configuration: TestSuiteConfiguration;
  
  // Lifecycle hooks
  beforeAll?: LifecycleHook;
  afterAll?: LifecycleHook;
  beforeEach?: LifecycleHook;
  afterEach?: LifecycleHook;
}

/**
 * Test suite configuration
 */
export interface TestSuiteConfiguration {
  parallel: boolean;
  maxConcurrency?: number;
  timeout: number;
  retryFailedTests: boolean;
  maxRetries: number;
  stopOnFirstFailure: boolean;
  randomizeOrder: boolean;
  seed?: number;
}

/**
 * Lifecycle hook function
 */
export type LifecycleHook = () => Promise<void> | void;

/**
 * Test execution report
 */
export interface TestExecutionReport {
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
  summary: TestSummary;
  trends?: TestTrends;
}

/**
 * Test summary
 */
export interface TestSummary {
  successRate: number;
  averageExecutionTime: number;
  criticalFailures: number;
  performanceIssues: number;
  coveragePercentage: number;
  regressions: number;
  improvements: number;
}

/**
 * Test trends over time
 */
export interface TestTrends {
  successRateTrend: TrendDataPoint[];
  executionTimeTrend: TrendDataPoint[];
  coverageTrend: TrendDataPoint[];
}

/**
 * Trend data point
 */
export interface TrendDataPoint {
  timestamp: Date;
  value: number;
}

/**
 * Test runner interface
 */
export interface TestRunner {
  runTest(test: BaseTest): Promise<TestResult>;
  runSuite(suite: TestSuite): Promise<TestExecutionReport>;
  runTests(tests: BaseTest[], configuration?: TestRunConfiguration): Promise<TestExecutionReport>;
  
  // Filtering and selection
  runByCategory(category: TestCategory): Promise<TestExecutionReport>;
  runByTags(tags: string[]): Promise<TestExecutionReport>;
  runByPriority(priority: TestPriority): Promise<TestExecutionReport>;
  
  // State management
  isRunning(): boolean;
  cancel(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
}

/**
 * Test run configuration
 */
export interface TestRunConfiguration {
  parallel: boolean;
  maxConcurrency: number;
  timeout: number;
  retryFailedTests: boolean;
  maxRetries: number;
  stopOnFirstFailure: boolean;
  randomizeOrder: boolean;
  seed?: number;
  filter?: TestFilter;
  reporter?: TestReporter;
}

/**
 * Test filter
 */
export interface TestFilter {
  categories?: TestCategory[];
  priorities?: TestPriority[];
  tags?: string[];
  namePattern?: RegExp;
  excludeCategories?: TestCategory[];
  excludeTags?: string[];
}

/**
 * Test reporter interface
 */
export interface TestReporter {
  onTestStart(test: BaseTest): void;
  onTestComplete(test: BaseTest, result: TestResult): void;
  onSuiteStart(suite: TestSuite): void;
  onSuiteComplete(suite: TestSuite, report: TestExecutionReport): void;
  onRunStart(configuration: TestRunConfiguration): void;
  onRunComplete(report: TestExecutionReport): void;
}

/**
 * Property test runner interface
 */
export interface PropertyTestRunner {
  runPropertyTest(test: PropertyTest): Promise<TestResult>;
  shrinkCounterExample(test: PropertyTest, counterExample: any): Promise<any>;
  generateTestData(generator: DataGenerator, count: number): any[];
}

/**
 * Test data generator registry
 */
export interface TestDataGeneratorRegistry {
  register<T>(name: string, generator: DataGenerator<T>): void;
  unregister(name: string): boolean;
  get<T>(name: string): DataGenerator<T> | null;
  getAll(): Record<string, DataGenerator>;
  
  // Composite generators
  combine<T>(...generators: DataGenerator<T>[]): DataGenerator<T[]>;
  oneOf<T>(...generators: DataGenerator<T>[]): DataGenerator<T>;
  frequency<T>(weightedGenerators: Array<{ weight: number; generator: DataGenerator<T> }>): DataGenerator<T>;
}

/**
 * Test analytics interface
 */
export interface TestAnalytics {
  recordTestResult(test: BaseTest, result: TestResult): Promise<void>;
  getTestHistory(testId: string): Promise<TestResult[]>;
  getTestTrends(testId: string, timeRange: TimeRange): Promise<TestTrends>;
  getFlakiness(testId: string): Promise<FlakinessReport>;
  getPerformanceRegression(testId: string): Promise<RegressionReport>;
  generateReport(filter: TestAnalyticsFilter): Promise<AnalyticsReport>;
}

/**
 * Time range for analytics
 */
export interface TimeRange {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Flakiness report
 */
export interface FlakinessReport {
  testId: string;
  flakinessScore: number; // 0-1, where 1 is most flaky
  totalRuns: number;
  inconsistentRuns: number;
  patterns: FlakinessPattern[];
  recommendations: string[];
}

/**
 * Flakiness pattern
 */
export interface FlakinessPattern {
  type: 'timing' | 'environment' | 'data' | 'concurrency';
  description: string;
  frequency: number;
  confidence: number;
}

/**
 * Regression report
 */
export interface RegressionReport {
  testId: string;
  hasRegression: boolean;
  regressionType: 'performance' | 'functionality' | 'coverage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  baseline: any;
  current: any;
  changePercentage: number;
  detectedAt: Date;
}

/**
 * Test analytics filter
 */
export interface TestAnalyticsFilter {
  testIds?: string[];
  categories?: TestCategory[];
  timeRange?: TimeRange;
  includeFlaky?: boolean;
  includeRegressions?: boolean;
}

/**
 * Analytics report
 */
export interface AnalyticsReport {
  generatedAt: Date;
  timeRange: TimeRange;
  summary: AnalyticsSummary;
  testResults: TestResult[];
  trends: TestTrends;
  flakyTests: FlakinessReport[];
  regressions: RegressionReport[];
  recommendations: Recommendation[];
}

/**
 * Analytics summary
 */
export interface AnalyticsSummary {
  totalTests: number;
  averageSuccessRate: number;
  averageExecutionTime: number;
  coveragePercentage: number;
  flakyTestCount: number;
  regressionCount: number;
  improvementCount: number;
}

/**
 * Recommendation for test improvements
 */
export interface Recommendation {
  type: 'performance' | 'reliability' | 'coverage' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  actionItems: string[];
}

/**
 * Test factory interface
 */
export interface TestFactory {
  createUnitTest(config: UnitTestConfig): UnitTest;
  createPropertyTest(config: PropertyTestConfig): PropertyTest;
  createIntegrationTest(config: IntegrationTestConfig): IntegrationTest;
  createPerformanceTest(config: PerformanceTestConfig): PerformanceTest;
  createTestSuite(config: TestSuiteConfig): TestSuite;
}

/**
 * Test configuration interfaces
 */
export interface UnitTestConfig {
  name: string;
  description: string;
  test: TestFunction;
  priority?: TestPriority;
  tags?: string[];
  timeout?: number;
  expectedResult?: any;
  assertions?: AssertionFunction[];
}

export interface PropertyTestConfig {
  name: string;
  description: string;
  property: PropertyFunction;
  generator: DataGenerator;
  priority?: TestPriority;
  tags?: string[];
  iterations?: number;
  shrinkingEnabled?: boolean;
}

export interface IntegrationTestConfig {
  name: string;
  description: string;
  test: TestFunction;
  dependencies: string[];
  environment: TestEnvironment;
  priority?: TestPriority;
  tags?: string[];
  timeout?: number;
}

export interface PerformanceTestConfig {
  name: string;
  description: string;
  test: TestFunction;
  performanceTargets: PerformanceTargets;
  priority?: TestPriority;
  tags?: string[];
  loadProfile?: LoadProfile;
}

export interface TestSuiteConfig {
  name: string;
  description: string;
  tests: BaseTest[];
  configuration?: Partial<TestSuiteConfiguration>;
  beforeAll?: LifecycleHook;
  afterAll?: LifecycleHook;
  beforeEach?: LifecycleHook;
  afterEach?: LifecycleHook;
}