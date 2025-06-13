import TopNav from "../components/Navbar";

// LogViewer.tsx
import React, { useEffect, useRef, useState } from "react";
import { BASE_URL, checkJobStarted, getConsoleLog, sleep } from "../models/Api"; // Adjust the import based on your project structure
import { useLocation } from "react-router-dom";
import BuildStage from "./../components/BuildStage";
import CircularProgress from "@mui/joy/CircularProgress";
import ChatScreen from "./ChatScreen";

type LogStreamingProps = {
  buildNumber?: number;
  buildStages: string[];
};

const LogStreamingScreen: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [finished, setFinished] = useState<boolean>(false);

  const logEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const props = location.state as LogStreamingProps;

  const stageRegexMap = {
    clone: /clone|cloning/i,
    validate: /validate|Validating|Starting validation/i,
    compile: /compile|Compiling|Building modules|javac|scalac|tsc|babel/i,
    test: /test(?:ing)?|Running tests|Executing tests|Test suite|Results :|mocha|jest|pytest/i,
    package:
      /package|Packaging|Creating artifact|Generating jar|zip|tar|npm pack/i,
    verify: /verify|Verifying|Verifications/i,
    install: /install|Installing artifact|mvn install|Artifact installed/i,
    build: /build|building/i,
    deploy:
      /deploy|Deploying|Uploading|Pushing|mvn deploy|Deploying to repository/i,
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        var started = false;
        // Wait until the job has started
        do {
          started = await checkJobStarted(
            decodeURIComponent(location.pathname.replace(/^\/log\/?/, "")),
            props.buildNumber || 0
          );
          await sleep(1000); // Wait for 1 second before checking again
        } while (!started);
        const sessionId = await getConsoleLog(
          decodeURIComponent(location.pathname.replace(/^\/log\/?/, "")),
          props.buildNumber || 0
        );

        const eventSource = new EventSource(
          `${BASE_URL}/logs/stream/${sessionId}`
        );
        setLoading(false);

        eventSource.onmessage = (e) => {
          var logLine = e.data.trim();
          if (logLine !== "") {
            setLogs((prev) => [...prev, e.data]);
            logLine.trim().toLowerCase().replace(/\s+/g, " ");
            for (const [stage, regex] of Object.entries(stageRegexMap)) {
              if (regex.test(logLine)) {
                setCurrentStage(stage);
                break;
              }
            }
          }
          if(eventSource.readyState == eventSource.CLOSED){
            setFinished(true);
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
        };

        return () => {
          eventSource.close();
          // setCurrentStage(props.buildStages[props.buildStages.length -1] || "");
        };
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };

    fetchLogs();
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);
  if (loading) {
    return (
      <div className="d-flex flex-column gap-3 justify-content-center align-items-center w-100 h-100">
        <TopNav />
        <CircularProgress variant="plain" />
        <h4>Tigerring Job...</h4>
      </div>
    );
  } else {
    return (
      <div
        className="d-flex w-100 h-100"
        style={{
          paddingTop: "4.5rem",
        }}
      >
        <TopNav />
        <div className="w-25 d-flex flex-column p-5">
          {props.buildStages.map((stage, index) => {
            if (!finished) {
              let currentIndex = props.buildStages.indexOf(currentStage);
              if (index < currentIndex) {
                return (
                  <BuildStage
                    key={index}
                    status="completed"
                    name={
                      stage.substring(0, 1).toUpperCase() + stage.substring(1)
                    }
                  />
                );
              } else if (index > currentIndex) {
                return (
                  <BuildStage
                    key={index}
                    status="pending"
                    name={
                      stage.substring(0, 1).toUpperCase() + stage.substring(1)
                    }
                  />
                );
              } else {
                return (
                  <BuildStage
                    key={index}
                    status="inprogress"
                    name={
                      stage.substring(0, 1).toUpperCase() + stage.substring(1)
                    }
                  />
                );
              }
            } else {
              return (
                <BuildStage
                  key={index}
                  status="completed"
                  name={
                    stage.substring(0, 1).toUpperCase() + stage.substring(1)
                  }
                />
              );
            }
          })}
        </div>
        <div
          style={{
            backgroundColor: "#000",
            color: "#0f0",
            padding: "1rem",
            height: "80vh",
            width: "75%",
            overflowY: "auto",
            fontFamily: "monospace",
            margin: "1rem",
            textAlign: "left",
            scrollbarWidth: "none",
            borderRadius: "10px",
          }}
        >
          {logs.map((line, index) => (
            <div key={index}>
              {`${index}  - `}
              {line}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
        <ChatScreen/>
      </div>
    );
  }
};

export default LogStreamingScreen;
