import Setup from "./screens/SetupScreen";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import FolderContentScreen from "./screens/FolderContentScreen";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { applyTheme } from "./components/ThemeToggle";
import StartupRedirect from "./models/StartupRedirect";
import JobDetailScreen from "./screens/JobDetailScreen";
import LogStreamingScreen from "./screens/LogStreamingScreen";

function App() {
  applyTheme();
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StartupRedirect />} />
          <Route path="/setup" element={<Setup />}></Route>
          <Route path="/job/*" element={<JobDetailScreen />}></Route>
          <Route path="/log/*" element={<LogStreamingScreen />}></Route>
          <Route path="/folder/*" element={<FolderContentScreen />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
