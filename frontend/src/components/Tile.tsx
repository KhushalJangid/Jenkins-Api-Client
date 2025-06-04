import { useLocation, useNavigate } from "react-router-dom";

export default function Tile(props: {
  name: string;
  type: string;
  isFolder: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const handleClick = (tileName: string, isFolder: boolean) => {
    // Extract the current folder path from the URL (removing "/folder/")
    const currentPath = decodeURIComponent(
      location.pathname.replace(/^\/folder\/?/, "")
    );
    console.log("Navigating to folder:", tileName);
    if (isFolder) {
      const nextPath = currentPath ? `${currentPath}/${tileName}` : tileName;
      navigate(`/folder/${nextPath}`);
    } else {
      const nextPath = currentPath ? `${currentPath}/${tileName}`:tileName;
      navigate(`/job/${nextPath}`);
    }
  };
  return (
    <div
      className="tile"
      onClick={() => handleClick(props.name, props.isFolder)}
    >
      {props.isFolder ? (
        <i className="bi bi-folder me-3 h4"></i>
      ) : (
        <i className="bi bi-boxes me-3 h4"></i>
      )}
      <div className="d-flex flex-column align-items-start">
        <div>{props.name}</div>
        <p className="text-secondary small mb-2">{props.type}</p>
      </div>
      <i className="bi bi-chevron-right ms-auto"></i>
    </div>
  );
}
