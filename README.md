<h1 align="center">Jenkins Api Client</h1>

<p align="center">
  <img alt="Github top language" src="https://img.shields.io/github/languages/top/KhushalJangid/Jenkins-Api-Client?color=56BEB8">
  <img alt="Github language count" src="https://img.shields.io/github/languages/count/KhushalJangid/Jenkins-Api-Client?color=56BEB8">
  <img alt="Repository size" src="https://img.shields.io/github/repo-size/KhushalJangid/Jenkins-Api-Client?color=56BEB8">
  <img alt="License" src="https://img.shields.io/github/license/KhushalJangid/Jenkins-Api-Client?color=56BEB8">
  <img alt="Github issues" src="https://img.shields.io/github/issues/KhushalJangid/Jenkins-Api-Client?color=56BEB8" />
  <img alt="Github forks" src="https://img.shields.io/github/forks/KhushalJangid/Jenkins-Api-Client?color=56BEB8" />
  <img alt="Github stars" src="https://img.shields.io/github/stars/KhushalJangid/Jenkins-Api-Client?color=56BEB8" />
  <img alt="Visitors" src="https://visitor-badge.laobi.icu/badge?page_id=khushaljangid/Jenkins-Api-Client&format=true">
</p>

## Index

- [About](#about)
- [Project Structure](#project-structure)
- [Features](#features)
- [Technologies](#technologies)
- [Requirements](#requirements)
- [How to use](#how-to-use)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [API Usage](#api-usage)
- [Customization](#customization)

<br>

## About

**Jenkins Api Client** is a Java-based project for interacting with Jenkins servers via REST API. It provides a backend service (Spring Boot) to fetch job details, trigger builds, and analyze Jenkins job configurations. The project also includes a frontend for visualizing Jenkins job information.

## Project Structure

```
.
├── frontend           # React-based UI for Jenkins job visualization
├── backend            # Spring Boot REST API for Jenkins integration
├── README.md
```

## Features

- **Jenkins Integration**: Connects to Jenkins using REST API and basic authentication.
- **Simple UI/UX**: A simple and functional UI/UX with adaptive colour scheme
- **Job Discovery**: Lists all jobs and folders recursively.
- **Job Details**: Fetches job metadata, build history, parameters, and Test Suites.
- **Trigger Builds**: Start Jenkins jobs with or without parameters.
- **Trigger Custom Tests**: Start Jenkins jobs only selected test cases.
- **Job Execution Monitoring**: Displays live logs from jenkins along with Maven Lifecycle stage tracking
- **AI Chat Integration**: Integrated chat support for resolving issues in job execution

## Technologies

- **Backend**: Java, Spring Boot, Java HTTP Client
- **Frontend**: React, TypeScript, Bootstrap
- **Build Tools**: Maven, Vite

## Requirements

- [Java 21+](https://www.java.com/en/)
- [Maven](https://maven.apache.org/)
- [Node.js](https://nodejs.org/)
- Access to a Jenkins server with API token

## How to use

### Backend Setup

1. **Clone the repository:**
    ```sh
    git clone https://github.com/KhushalJangid/Jenkins-Api-Client.git
    cd Jenkins-Api-Client/backend
    ```

2. **Build and run the backend:**
    ```sh
    cd Jenkins-Api-Client/backend
    mvn spring-boot:run
    ```

3. The backend will run on [http://localhost:8090](http://localhost:8090) by default.

### Frontend Setup

1. **Install dependencies and start the frontend:**
    ```sh
    cd frontend
    npm install
    npm run dev
    ```

2. The frontend will run on [http://localhost:5173](http://localhost:5173) by default.

### API Usage

- **Configure Jenkins Connection:**
  ```
  POST /api/configure
  {
    "url": "http://your-jenkins-url",
    "username": "your-username",
    "token": "your-api-token"
  }
  ```

- **Get all jobs inside the given folder:**
  ```
  POST /api/jobs
  {
    path: "Folder1/Folder2/"
  }
  ```

- **Get job details:**
  ```
  POST /api/job/get
  {
    path: "Folder1/Folder2/MyJob"
  }
  ```

- **Trigger a job:**
  ```
  POST /api/job/trigger
  {
    job: "Folder1/Folder2/MyJob",
  }
  ```

- **Trigger with parameters:**
  ```
  POST /api/job/trigger
  {
    job: "Folder1/Folder2/MyJob",
    parameters: {
      "name":"value"
    }
  }
  ```

- **Check if Build Started (Boolean Response):**
  ```
  POST /api/logs/status
  {
    path: "Folder1/Folder2/MyJob",
    buildNumber: 21
  }
  ```

- **Start a log streaming session:**
  ```
  POST /api/logs/session
  {
    path: "Folder1/Folder2/MyJob",
    buildNumber: 21
  }
  Response: {
    sessionId: ""
  }
  ```

- **Streaming Logs (Server Sent Events (SSE) Emitter):**
  ```
  POST /api/logs/stream/{sessionId}
  ```

- **List test cases in the given repository (Maven Projects only):**
  ```
  POST /api/testcases/list
  {
    scmUrl: "https://github.com/*.git",
    scmBranch: "main"
  }
  ```

## Customization

- **Add new backend endpoints:** Edit `backend/src/main/java/com/example/jenkinsapi/controller/`.
- **Change frontend appearance:** Edit `frontend/src/`.

&#xa0;

<a href="#top">Back to top</a>