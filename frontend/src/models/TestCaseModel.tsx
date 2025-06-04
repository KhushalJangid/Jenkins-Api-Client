export interface TestCase {
  className: string;
  methodName: string;
}

// export interface SuiteParameters {
//   headless?: string;
//   browser?: string;
//   logMode: string;
//   url: string;
// }

export interface TestSuite {
  testCases: TestCase[];
  parameters: {
    [name: string]: string;
  };
}

export interface TestSuites {
  [suiteName: string]: TestSuite;
}
