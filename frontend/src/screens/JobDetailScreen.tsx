import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getJobDetails } from "../models/Api";
import TopNav from "../components/Navbar";
import type { JenkinsJobDetail } from "../models/JenkinsJobModel";
import JobParameterForm from "./TriggerForm";
import CircularProgress from "@mui/joy/CircularProgress";

export default function JobDetailScreen() {
  const location = useLocation();
  const folderPath = decodeURIComponent(
    location.pathname.replace(/^\/job\/?/, "").replace(/^\/folder\/?/, "")
  );

  const [job, setJob] = useState<JenkinsJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  console.log(folderPath);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobDetails = await getJobDetails(folderPath);
        setJob(jobDetails);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load job details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [folderPath]);

  if (loading) {
    return (
      <div
        className="d-flex flex-column gap-3 justify-content-center align-items-center w-100 h-100"
      >
        <TopNav />
        <CircularProgress variant="plain" />
        <h4>Loading Job Details...</h4>
      </div>
    );
  }
  if (error) return <div className="alert alert-danger">{error}</div>;
  console.log(job?.buildStages);
  return (
    <div className="d-flex w-100 h-100">
      <TopNav />
      <div className="w-40 d-flex flex-column p-5 mt-5 border-end">
        <h4 className="my-3">
          {" "}
          <i className="bi bi-clock-history"></i> Recent Builds
        </h4>
        {job && job.recentBuilds.length > 0 ? (
          <div
            className="mb-3 d-flex flex-column"
            style={{
              overflowY: "auto",
              maxHeight: "70vh",
              scrollbarWidth: "thin",
            }}
          >
            {job.recentBuilds.map((build, index) => (
              <div className="tile" key={index}>
                {build.result == "SUCCESS" ? (
                  <i className="bi bi-check-circle h4 me-3 text-success"></i>
                ) : (
                  <i className="bi bi-x-circle h4 me-3 text-danger"></i>
                )}
                <div className="d-flex flex-column align-items-start">
                  <div>
                    Build #{build.number} —{" "}
                    {new Date(build.timestamp).toLocaleString()}
                  </div>
                  <a
                    target="_blank"
                    href={job.reportUrl}
                    className="text-secondary small mb-2"
                  >
                    View Report <i className="bi bi-box-arrow-up-right"></i>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No recent builds available.</p>
        )}
      </div>
      <div className="w-60 d-flex flex-column p-5 mt-5">
        <h3 className="my-4">Name: {job?.name}</h3>
        <p>{job?.description || "No description available."}</p>

        <hr />
        <JobParameterForm
          parameters={job?.parameters ?? []}
          buildNumber={job?.nextBuildNumber ?? 0}
          buildStages={job?.buildStages ?? []}
          scmUrl={job?.scmUrl ?? ""}
          scmBranch={job?.scmBranch ?? ""}
          isMavenJob={job?.isMavenJob ?? false}
        />
      </div>
    </div>
  );
}
