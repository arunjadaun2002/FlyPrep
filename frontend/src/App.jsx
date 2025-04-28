import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import AIInterview from './components/AIInterview'
import Dashboard from './components/Dashboard'
import GroupDiscussion from './components/GroupDiscussion'
import InterviewOptions from './components/InterviewOptions'
import Navbar from './components/Navbar'
import ReportBug from './components/ReportBug'
import ScheduleInterview from './components/ScheduleInterview'

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/report-bug" element={<ReportBug />} />
          <Route path="/group-discussion" element={<GroupDiscussion />} />
          <Route path="/mock-interview" element={<InterviewOptions />} />
          <Route path="/ai-interview" element={<AIInterview />} />
          <Route path="/schedule-interview" element={<ScheduleInterview />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App 