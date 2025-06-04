// models/JenkinsJobDetail.ts

export interface JenkinsJobDetail {
  name: string;
  description: string;
  isMavenJob: boolean;
  url: string;
  reportUrl: string;
  scmUrl: string;
  scmBranch: string;
  buildable: boolean;
  nextBuildNumber: number;
  parameters: JenkinsParameter[];
  recentBuilds: JenkinsBuild[];
  buildStages: string[];
}

export interface JenkinsParameter {
  name: string;
  type: string;
  description?: string;
  defaultParameterValue?: {
    value: string | boolean | number;
  };
  choices?: string[];
}

export interface JenkinsBuild {
  number: number;
  result: "SUCCESS" | "FAILURE" | "ABORTED" | "UNSTABLE" | null;
  timestamp: number;
  duration: number;
  url: string;
  building: boolean;
}
