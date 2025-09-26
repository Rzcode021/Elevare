import React, { useState } from 'react';
import './App.css';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage/LandingPage';
import StudentInputForm from './components/StudentInputForm/StudentInputForm';
import AptitudeTest from './components/AptitudeTest/AptitudeTest';
import CalculateResult from './components/CalculateResult/CalculateResult';
import CareerRecommendation from './components/CareerRecommendation/CareerRecommendation';
import ChallengeIntro from './components/CareerChallenge/ChallengeIntro';
import DailyTask from './components/CareerChallenge/DailyTask';
import PerformanceTracker from './components/CareerChallenge/PerformanceTracker';
import MentorList from './components/Mentorship/MentorList';
import MentorChat from './components/Mentorship/MentorChat';
import MentorProfile from './components/Mentorship/MentorProfile';
import SessionAgenda from './components/Mentorship/SessionAgenda';
import SessionSummary from './components/Mentorship/SessionSummary';
import { calculateResults } from './utils/calculateResults';
import NavBar from './components/NavBar/NavBar';

export default function App() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [studentData, setStudentData] = useState(null);
  const [assessmentId, setAssessmentId] = useState(null);
  const [backendQuestions, setBackendQuestions] = useState(null);
  const [aptitudeAnswers, setAptitudeAnswers] = useState(null);
  const [results, setResults] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  
  // Career Challenge state
  const [challengeDay, setChallengeDay] = useState(1);
  const [completedDays, setCompletedDays] = useState([]);
  
  // Mentorship state
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [agendaItems, setAgendaItems] = useState([]);
  const [sessionNotes, setSessionNotes] = useState('');

  // Mentors are fetched by the MentorList component when no `mentors` prop is provided

  // Navigation handlers
  const handleStart = () => {
    // prefer route navigation when router is available
    try { navigate('/form'); } catch(e) { setStep(1); }
  };

  const handleStudentSubmit = (data) => {
    // send initial profile to backend to create assessment
    setStudentData(data);
    const payload = { initial_profile: data };
    fetch('http://127.0.0.1:8000/api/assessments/create/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((json) => {
        // backend returns { assessment_id, questions }
        setAssessmentId(json.assessment_id);
        setBackendQuestions(json.questions || null);
  try { navigate('/aptitude'); } catch(e) { setStep(2); }
      })
      .catch((err) => {
        console.error('Failed to create assessment:', err);
        // fallback to local flow
  try { navigate('/aptitude'); } catch(e) { setStep(2); }
      });
  };

  const handleAptitudeComplete = async (answers) => {
    setAptitudeAnswers(answers);
    // Try to submit answers to backend if assessmentId is available
    if (assessmentId) {
      try {
        const resp = await fetch(
          `http://127.0.0.1:8000/api/assessments/${assessmentId}/submit/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(answers),
          }
        );
        const data = await resp.json();
  setResults(data);
  try { navigate('/results'); } catch(e) { setStep(3); }
        return;
      } catch (e) {
        console.error('Failed to submit answers to backend, falling back to local compute', e);
      }
    }

    // Fallback to local calculation
    const computedResults = calculateResults(answers);
    setResults(computedResults);
    try { navigate('/results'); } catch(e) { setStep(3); }
  };

  const handleCalculationNext = () => {
    const recs = results?.recommendations || [];
    const careerNames = recs.map((r) => (typeof r === 'string' ? r : r.career));
    setRecommendations(careerNames);
    try { navigate('/career'); } catch(e) { setStep(4); }
  };

 const handleAcceptRoadmap = () => {
  try { navigate('/mentors'); } catch(e) { setStep(8); }
};


  const handleTakeChallenge = () => {
    setChallengeDay(1);
    setCompletedDays([]);
    setStep(5);
  };

  const handleCancel = () => setStep(0);

  // Career Challenge handlers
  const handleStartChallenge = () => setStep(6);

  const handleCompleteTask = (day) => {
    setCompletedDays((prev) => [...new Set([...prev, day])]);
    if (day < 14) {
      setChallengeDay(day + 1);
    } else {
      setStep(7);
    }
  };

  const handlePrevTask = () => {
    if (challengeDay > 1) setChallengeDay(challengeDay - 1);
  };

  // Mentorship handlers
  const handleSelectMentor = (mentor) => {
    try { navigate(`/mentors/${mentor.id}`, { state: { mentor } }); } catch(e) { setSelectedMentor(mentor); setStep(9); }
  };

  const handleStartSessionFromProfile = async (mentor) => {
    // Call backend to create session then open chat
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/mentors/${mentor.id}/start-session/`, { method: 'POST' });
      const session = await res.json();
      const mentorWithSession = { ...mentor, session };
      setSelectedMentor(mentorWithSession);
      // navigate to the mentor profile and pass the mentor (with session) in state
      try { navigate(`/mentors/${mentor.id}`, { state: { mentor: mentorWithSession } }); } catch(e) { setStep(9); }
    } catch (e) {
      console.error('Failed to start session', e);
      // still open chat without server session
      setSelectedMentor(mentor);
      try { navigate(`/mentors/${mentor.id}`, { state: { mentor } }); } catch(e) { setStep(9); }
    }
  };

  const handleBackToMentorList = () => {
    try { navigate('/mentors'); } catch(e) { setSelectedMentor(null); setStep(8); }
  };

  const handleAddAgendaItem = (item) => {
    setAgendaItems((prev) => [...prev, item]);
  };

  const handleSaveSessionNotes = (notes) => {
    setSessionNotes(notes);
  };

  return (
    <>
      <NavBar onStart={handleStart} />
      <Routes>
        <Route path="/" element={<LandingPage onStart={handleStart} onNavigate={(key) => key === 'mentors' && handleAcceptRoadmap()} />} />
        <Route path="/form" element={<StudentInputForm onSubmit={handleStudentSubmit} />} />
        <Route path="/aptitude" element={<AptitudeTest onComplete={handleAptitudeComplete} questions={backendQuestions} />} />
        <Route path="/results" element={<CalculateResult results={results} onNext={handleCalculationNext} />} />
        <Route path="/career" element={<CareerRecommendation recommendations={recommendations} onAccept={handleAcceptRoadmap} onChallenge={handleTakeChallenge} onCancel={handleCancel} />} />
        <Route path="/challenge" element={<ChallengeIntro onStart={handleStartChallenge} />} />
        <Route path="/task" element={<DailyTask day={challengeDay} onComplete={handleCompleteTask} onPrev={handlePrevTask} />} />
        <Route path="/tracker" element={<PerformanceTracker completedDays={completedDays} />} />

        <Route path="/mentors" element={<MentorList onSelect={handleSelectMentor} />} />
        <Route path="/mentors/:mentorId" element={<MentorProfile onBack={handleBackToMentorList} onStartSession={handleStartSessionFromProfile} />} />

        <Route path="/session-summary" element={<SessionSummary initialNotes={sessionNotes} />} />
      </Routes>
    </>
  );
}
