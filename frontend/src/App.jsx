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
import TrialQuiz from './components/TrialQuiz/TrialQuiz';
import SessionAgenda from './components/Mentorship/SessionAgenda';
import SessionSummary from './components/Mentorship/SessionSummary';
import { calculateResults } from './Utils/calculateResults';
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
    
    // Show loading state
    setBackendQuestions([]); // Clear any existing questions
    setAssessmentId(null); // Clear any existing assessment ID
    
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 150000); // 2.5 minutes timeout
    
    fetch('http://127.0.0.1:8000/api/assessments/create/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((json) => {
        clearTimeout(timeoutId); // Clear timeout on success
        // backend returns { assessment_id, questions }
        if (json.assessment_id && json.questions && json.questions.length > 0) {
          setAssessmentId(json.assessment_id);
          setBackendQuestions(json.questions);
          // persist assessment id so user can refresh without losing questions
          try { localStorage.setItem('assessment_id', json.assessment_id); } catch(e) {}
          try { navigate('/aptitude'); } catch(e) { setStep(2); }
        } else {
          throw new Error('Invalid response from assessment service');
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId); // Clear timeout on error
        console.error('Failed to create assessment:', err);
        
        // Handle different types of errors
        let errorMessage = 'Assessment creation failed. ';
        if (err.name === 'AbortError') {
          errorMessage += 'Request timed out after 2.5 minutes. Please try again.';
        } else if (err.message.includes('503')) {
          errorMessage += 'The assessment service is temporarily unavailable. Please ensure the n8n webhook is properly configured and try again.';
        } else {
          errorMessage += err.message;
        }
        
        alert(`${errorMessage}\n\nPlease ensure the n8n webhook is properly configured.`);
      });
  };

  // On app mount, if there's an assessment_id persisted but no backendQuestions yet, fetch them
  React.useEffect(() => {
    const savedId = localStorage.getItem('assessment_id');
    if (savedId && !backendQuestions) {
      setAssessmentId(savedId);
      (async () => {
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/assessments/${savedId}/`);
          if (res.ok) {
            const data = await res.json();
            if (data.questions && data.questions.length > 0) {
              setBackendQuestions(data.questions);
            } else {
              console.warn('No questions found in persisted assessment');
              localStorage.removeItem('assessment_id');
            }
          } else {
            console.warn('Failed to load persisted assessment, clearing stored ID');
            localStorage.removeItem('assessment_id');
          }
        } catch (e) {
          console.error('Failed to load persisted assessment questions', e);
          localStorage.removeItem('assessment_id');
        }
      })();
    }
  }, [backendQuestions]);

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
      <div className="background-animated" aria-hidden="true"></div>
      <NavBar onStart={handleStart} />
      <Routes>
        <Route path="/" element={<LandingPage onStart={handleStart} onNavigate={(key) => {
          if (key === 'mentors') return handleAcceptRoadmap();
          if (key === 'trial') return navigate('/trial');
        }} />} />
        <Route path="/form" element={<StudentInputForm onSubmit={handleStudentSubmit} />} />
        <Route path="/aptitude" element={<AptitudeTest onComplete={handleAptitudeComplete} questions={backendQuestions} />} />
        <Route path="/results" element={<CalculateResult results={results} onNext={handleCalculationNext} />} />
        <Route path="/career" element={<CareerRecommendation recommendations={recommendations} onAccept={handleAcceptRoadmap} onChallenge={handleTakeChallenge} onCancel={handleCancel} />} />
  <Route path="/trial" element={<TrialQuiz />} />
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
