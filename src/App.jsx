import { BrowserRouter, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import MyFiles from "./pages/MyFiles";
import Subscription from "./pages/Subscription";
import Transaction from "./pages/Transaction";
import  Upload  from "./pages/Upload";
import PublicFileView from "./pages/PublicFileView";

const App = () => {
  return (
   <BrowserRouter>
     {/* Your routes go here */}
     <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-files" element={<MyFiles />} />
        <Route path="/public-file-view" element={< PublicFileView />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/transaction" element={<Transaction />} />
        <Route path="/upload" element={<Upload />} />

     </Routes>
   </BrowserRouter>

  )
}

export default App;