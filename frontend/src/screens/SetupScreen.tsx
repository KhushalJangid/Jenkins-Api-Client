// import React from "react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { configureJenkins, getJobs } from "../models/Api";
import { ToastContainer, toast } from "react-toastify";
import { getTheme } from "../components/ThemeToggle";
import type { TileProps } from "../models/TileProps";

// import { navToPage } from "../models/Navigator";

export default function Setup() {
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [isConfigured, setConfigured] = useState(false);

  const [folders, setFolders] = useState<TileProps[]>();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolder) {
      toast.error("Please select a folder.");
      return;
    }
    localStorage.setItem("selectedFolder", selectedFolder);
    navigate(`/folder/${selectedFolder}`);
  };

  const configure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !username || !apiToken) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      const response = await configureJenkins({ url, username, apiToken });
      if (response) {
        setConfigured(true);
        toast.success("Configuration successful!");
        try {
          let jobList = await getJobs("");
          let folderList: TileProps[] = [];
          for (let i = 0; i < jobList.length; i++) {
            if (jobList[i].isFolder) {
              folderList.push(jobList[i]);
            }
          }
          if (folderList.length != 0) {
            setFolders([
              { name: "", type: "Folder", isFolder: true },
              ...folderList,
            ]);
          } else {
            localStorage.setItem("selectedFolder", "");
            navigate(`/folder/${selectedFolder}`);
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to fetch Jenkins jobs.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Configuration failed. Please check your inputs.");
    }
  };

  return (
    <div className="d-flex w-100 h-100">
      <div className="w-50">
        <img src="src/assets/Login-amico.svg" className="h-100" alt="" />
      </div>
      {!isConfigured ? (
        <form
          onSubmit={configure}
          className="d-flex flex-column align-items-center w-50 p-5"
        >
          <h2 className="my-4">Setup</h2>
          <div className="d-flex flex-column align-items-start mb-3 w-75">
            <label className="form-label">Jenkins URL</label>
            <input
              type="text"
              className="form-control"
              placeholder="https://jenkins.example.com"
              aria-label="Jenkins URL"
              onChange={(e) => setUrl(e.target.value)}
              id="url"
              required
            />
          </div>
          <div className="d-flex flex-column align-items-start mb-3 w-75">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="Your Jenkins username"
              aria-label="Jenkins username"
              onChange={(e) => setUsername(e.target.value)}
              id="username"
              required
            />
          </div>
          <div className="d-flex flex-column align-items-start mb-3 w-75">
            <label className="form-label">Api Key</label>
            <input
              type="password"
              className="form-control"
              placeholder="Your Jenkins API key"
              aria-label="Jenkins API key"
              onChange={(e) => setApiToken(e.target.value)}
              id="api-key"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-75 mt-5">
            Continue
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="d-flex flex-column align-items-center w-50 p-5"
        >
          <h2 className="my-4">Setup</h2>
          <div className="d-flex flex-column align-items-start mb-3 w-75">
            <label className="form-label">Select a Project Folder</label>
            <select
              id="folder"
              className="form-select w-75 mb-3"
              required
              value={folders ? folders[0].name : ""}
              onChange={(e) => setSelectedFolder(e.target.value)}
            >
              {folders?.map((job, index) => (
                <option key={index} value={job.name}>
                  {job.name !== ""? job.name: "Root Folder"}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-75 mt-5">
            Continue
          </button>
        </form>
      )}
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        theme={getTheme()}
      />
    </div>
  );
}
