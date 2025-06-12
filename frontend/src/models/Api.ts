import type { Message } from "../screens/ChatScreen";
import type { JenkinsJobDetail } from "./JenkinsJobModel";
import type { TestSuites } from "./TestCaseModel";
import type { TileProps } from "./TileProps";

export const BASE_URL = "http://localhost:8090/api";

// ----------- Types -----------

export interface JenkinsConfig {
  url: string;
  username: string;
  apiToken: string;
}

export interface BuildRequest {
  job: string;
  parameters?: Record<string, string>;
}

export interface ParameterDefinition {
  name: string;
  choices: string[];
}

// ----------- API Calls -----------

/**
 * Configure Jenkins server connection
 */
export async function configureJenkins(config: JenkinsConfig): Promise<string> {
  const response = await fetch(`${BASE_URL}/configure`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error("Failed to configure Jenkins");
  }

  // Store a flag in localStorage to mark it as configured
  localStorage.setItem("jenkinsConfigured", "true");
  localStorage.setItem("jenkinsUsername", config.username);
  localStorage.setItem("jenkinsUrl", config.url);

  return await response.text();
}

/**
 * Get list of all Jenkins job names
 */
export async function getJobs(path: string): Promise<TileProps[]> {
  const res = await fetch(`${BASE_URL}/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: path,
    }),
  });
  if (!res.ok) throw new Error("Failed to fetch jobs");
  let body = await res.json();
  console.log(body);
  return body;
}

/**
 * Get details of a specific Jenkins job
 */
export async function getJobDetails(
  jobPath: string
): Promise<JenkinsJobDetail> {
  const res = await fetch(`${BASE_URL}/job/get`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: jobPath,
    }),
  });
  if (!res.ok) throw new Error(`Failed to get details for job: ${jobPath}`);
  return res.json();
}

/**
 * Trigger a Jenkins job without parameters
 */
export async function triggerJob(jobName: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/job/trigger`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ job: jobName }),
  });

  if (!res.ok) throw new Error(`Failed to trigger job: ${jobName}`);
  return true;
}

/**
 * Trigger a Jenkins job with parameters
 */
export async function triggerJobWithParams(
  jobName: string,
  parameters: Record<string, string>
): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/job/trigger`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ job: jobName, parameters }),
  });

  if (!res.ok)
    throw new Error(`Failed to trigger job with parameters: ${jobName}`);
  return true;
}

/**
 * Trigger a Jenkins job with parameters
 */
export async function triggerTemporarySuite(
  jobName: string,
  parameters: Record<string, string>,
  suite: {}
): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/job/trigger/temp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      job: jobName,
      parameters: parameters,
      suite: suite,
    }),
  });

  if (!res.ok)
    throw new Error(`Failed to trigger job with parameters: ${jobName}`);
  return true;
}

/**
 * Fetch the console output for a specific build
 */
export async function getConsoleLog(
  jobPath: string,
  buildNumber: number
): Promise<string> {
  const response = await fetch(`${BASE_URL}/logs/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: jobPath,
      buildNumber: buildNumber,
    }),
  });
  const { sessionId } = await response.json();
  return sessionId;
}
export async function checkJobStarted(
  jobPath: string,
  buildNumber: number
): Promise<boolean> {
  const response = await fetch(`${BASE_URL}/logs/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: jobPath,
      buildNumber: buildNumber,
    }),
  });
  const started = await response.json();
  console.log("Job started status:", started);
  return started;
}

export async function getTestCases(
  remoteUrl: string,
  branchName: string
): Promise<TestSuites> {
  const res = await fetch(`${BASE_URL}/testcases/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      scmUrl: remoteUrl,
      branchName: branchName,
    }),
  });
  if (!res.ok) throw new Error(`Failed to get details for repo: ${remoteUrl}`);
  return res.json();
}

export async function sendMessage(chatHistory: Message[]): Promise<string> {
  const history = [];
  for (let i = 0; i < chatHistory.length; i++) {
    history.push({
      role: chatHistory[i].sender,
      parts: [{ text: chatHistory[i].text }],
    });
  }
  const response = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      history: history,
    }),
  });
  const res = await response.text();
  console.log("chat response", res);
  return response.status == 200 ? res:"No response";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
