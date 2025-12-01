import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MenuPage from './pages/MenuPage'
import ChoicePage from './pages/ChoicePage'
import TextPage from './pages/TextPage'
import ReviewPage from './pages/ReviewPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import AboutPage from './pages/AboutPage'
import GuidedReadingModePage from './pages/GuidedReadingModePage'
import ShortStoryPage from './pages/ShortStoryPage'
import TopicalPassagePage from './pages/TopicalPassagePage'
import FillInTheBlankPage from './pages/FillInTheBlankPage'
import ManageClassroomsPage from './pages/ManageClassroomsPage'
import ClassroomDetailsPage from './pages/ClassroomDetailsPage'
import JoinClassroomPage from './pages/JoinClassroomPage'
import MyClassroomPage from './pages/MyClassroomPage'
import StudentProgressPage from './pages/StudentProgressPage'
import CreateAssignmentPage from './pages/CreateAssignmentPage'
import AssignmentStudyPage from './pages/AssignmentStudyPage'
import AssignmentsPage from './pages/AssignmentsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/choice" element={<ChoicePage />} />
      <Route path="/text" element={<TextPage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/guided-reading" element={<GuidedReadingModePage />} />
      <Route path="/guided-reading/short-story" element={<ShortStoryPage />} />
      <Route path="/guided-reading/topical-passage" element={<TopicalPassagePage />} />
      <Route path="/guided-reading/fill-in-the-blank" element={<FillInTheBlankPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/manage-classrooms" element={<ManageClassroomsPage />} />
      <Route path="/classroom/:code" element={<ClassroomDetailsPage />} />
      <Route path="/classroom/:code/assignments" element={<AssignmentsPage />} />
      <Route path="/classroom/:code/create-assignment" element={<CreateAssignmentPage />} />
      <Route path="/assignment-study/:assignmentId" element={<AssignmentStudyPage />} />
      <Route path="/student-progress/:code/:studentEmail" element={<StudentProgressPage />} />
      <Route path="/join-classroom" element={<JoinClassroomPage />} />
      <Route path="/my-classroom" element={<MyClassroomPage />} />
    </Routes>
  )
}

export default App


