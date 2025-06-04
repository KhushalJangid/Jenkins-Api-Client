// import React from "react";
import { useEffect, useState } from "react";
import Tile from "../components/Tile";
// import type { BuildHistory } from "../models/BuildHistory";
import TopNav from "../components/Navbar";
import { getJobs } from "../models/Api";
import type { TileProps } from "../models/TileProps";
import { useLocation } from "react-router-dom";
import { CircularProgress } from "@mui/joy";

export default function FolderContentScreen() {
  const [jobs, setJobs] = useState<TileProps[]>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const fullPath = decodeURIComponent(
    location.pathname.replace("/folder/", "")
  );

  console.log("Full folder path:", fullPath); // e.g., "Backend/API"
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobList = await getJobs(fullPath);
        setJobs(jobList);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch Jenkins jobs.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [fullPath]);
  if (loading) {
    return (
      <div className="d-flex flex-column gap-3 justify-content-center align-items-center w-100 h-100">
        <TopNav />
        <CircularProgress variant="plain" />
        <h4>Fetching jobs...</h4>
      </div>
    );
  }
  if (error) {
    return (
      <div className="d-flex flex-column gap-3 justify-content-center align-items-center w-100 h-100">
        <TopNav />
        <div className="alert text-alert">{error}</div>
      </div>
    );
  }
  return (
    <div className="d-flex w-100 h-100">
      <TopNav />
      <div className="d-flex flex-column align-items-center w-100 p-5">
        <h2 className="my-5">Trigger a Jenkins Job</h2>
        <div className="d-flex flex-column w-60">
          {jobs?.map((job, index) => (
            <Tile
              name={job.name}
              type={job.type}
              isFolder={job.isFolder}
              key={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
