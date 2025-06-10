import React, { useState } from "react";
import {
  triggerJob,
  triggerJobWithParams,
  triggerTemporarySuite,
} from "../models/Api";
import { useLocation, useNavigate } from "react-router-dom";
import TestCaseSelection from "./TestCaseSelection";

interface JenkinsParameter {
  name: string;
  type: string;
  description?: string;
  choices?: string[];
  defaultParameterValue?: {
    value: any;
  };
}

interface Props {
  buildNumber: number;
  buildStages: string[];
  parameters: JenkinsParameter[];
  scmUrl?: string;
  scmBranch?: string;
  isMavenJob?: boolean;
}

const JobParameterForm: React.FC<Props> = (props) => {
  const initialState = Object.fromEntries(
    props.parameters.map((p) => [p.name, p.defaultParameterValue?.value ?? ""])
  );
  const [formData, setFormData] = useState<Record<string, any>>(initialState);
  const [selectedSuites, setSelectedSuites] = useState<{
    [testcase: string]: boolean;
  }>({});
  const [suiteParameters, setSuiteParameters] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const updateSuiteSelection = (checked: boolean, tc: string) => {
    selectedSuites[tc] = checked;
    setSelectedSuites(selectedSuites);
    console.log(selectedSuites);
  };

  const handleChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log(selectedSuites);
    e.preventDefault();
    var res;
    var jobPath = decodeURIComponent(
      location.pathname.replace(/^\/job\/?/, "")
    );
    let customSuite = Object.values(selectedSuites).reduce(
      (a, item) => a + (item === true ? 1 : 0),
      0
    );
    if (customSuite === 0) {
      if (props.parameters.length === 0) {
        res = await triggerJob(jobPath);
      } else {
        res = await triggerJobWithParams(jobPath, formData);
      }
    } else {
      let classes = [];
      Object.keys;
      for (let [key, value] of Object.entries(selectedSuites)) {
        if (value) {
          classes.push(key);
        }
      }
      res = await triggerTemporarySuite(jobPath, formData, {
        parameters: suiteParameters,
        classes: classes,
      });
    }
    if (res) {
      const path = decodeURIComponent(
        location.pathname.replace(/^\/job\/?/, "/log/")
      );
      navigate(path, {
        state: {
          buildNumber: props.buildNumber,
          buildStages: props.buildStages,
        },
      });
    }
  };

  return (
    <form
      className="d-flex flex-column align-items-center"
      onSubmit={handleSubmit}
    >
      <h3 className="mb-4">Parameters</h3>
      {props.parameters.length === 0 ? (
        <h4>No Parameters Defined</h4>
      ) : (
        props.parameters.map((param) => (
          <div key={param.name} className="mb-3 d-flex w-50 gap-5">
            <label className="form-label">
              {param.name.substring(0, 1).toUpperCase() +
                param.name.substring(1)}
            </label>

            {param.type === "ChoiceParameterDefinition" && (
              <select
                className="form-select"
                value={formData[param.name]}
                onChange={(e) => handleChange(param.name, e.target.value)}
              >
                {param.choices?.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
              </select>
            )}

            {param.type === "StringParameterDefinition" && (
              <input
                type="text"
                className="form-control"
                value={formData[param.name]}
                onChange={(e) => handleChange(param.name, e.target.value)}
              />
            )}

            {param.type === "BooleanParameterDefinition" && (
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={!!formData[param.name]}
                  onChange={(e) => handleChange(param.name, e.target.checked)}
                />
                <label className="form-check-label">Enabled</label>
              </div>
            )}
          </div>
        ))
      )}
      <hr className="w-100" />
      {props.isMavenJob && (
        <TestCaseSelection
          scmUrl={props.scmUrl || ""}
          scmBranch={props.scmBranch || "main"}
          updateSuiteSelection={updateSuiteSelection}
          setParameters={setSuiteParameters}
          // selectedSuites={selectedSuites}
        />
      )}

      <button type="submit" className="btn btn-primary mt-5">
        <i className="bi bi-play h5 me-1"></i>
        Build Now
      </button>
    </form>
  );
};

export default JobParameterForm;
