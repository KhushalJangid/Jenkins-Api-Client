import { CheckmarkOutline, ErrorOutline, Pending, Time } from "@carbon/icons-react";

interface BuildStageProps {
  status: "pending" | "inprogress" | "completed" | "failed";
  name: string;
}
export default function BuildStage(props: BuildStageProps) {
  return (
    <div className="d-flex my-2">
        {props.status === "pending"? <Pending size={20} strokeWidth={20} className="text-secondary my-auto me-3" /> :null}
        {props.status === "inprogress"? <Time size={20} className="text-primary my-auto me-3" /> :null}
        {props.status === "completed"? <CheckmarkOutline size={20} strokeWidth={20} className="text-success my-auto me-3" /> :null}
        {props.status === "failed"? <ErrorOutline size={20} className="text-danger my-auto me-3" /> :null}
        <h5 className="my-auto">{props.name}</h5>
    </div>
  )
}
