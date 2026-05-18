import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import "./styles.css";

function App() {
  const [role, setRole] = useState(null);

  return (
    <>
      {!role ? (
        <Login onLogin={setRole} />
      ) : (
        <Dashboard role={role} />
      )}
    </>
  );
}

export default App;
