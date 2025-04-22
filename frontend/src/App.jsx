import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import Dashboard from './components/Dashboard'
import GroupDiscussion from './components/GroupDiscussion'
import Navbar from './components/Navbar'
import ReportBug from './components/ReportBug'

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/report-bug" element={<ReportBug />} />
          <Route path="/group-discussion" element={<GroupDiscussion />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App 