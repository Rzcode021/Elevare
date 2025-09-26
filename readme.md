src/
  components/
    LandingPage/
      LandingPage.jsx
      LandingPage.css
    StudentInputForm/
      StudentInputForm.jsx
      StudentInputForm.styles.js
    AptitudeTest/
      AptitudeTest.jsx
      AptitudeQuestion.jsx
      AptitudeTest.styles.css
    CareerRecommendation/
      CareerRecommendation.jsx
      RoadmapDetail.jsx
    CareerChallenge/
      ChallengeIntro.jsx
      DailyTask.jsx
      PerformanceTracker.jsx
    Mentorship/
      MentorList.jsx
      MentorChat.jsx
      SessionAgenda.jsx
      SessionSummary.jsx
  App.jsx
  index.js
  styles/
    common.css


import React, { useState } from 'react';
import './App.css';
import LandingPage from './components/LandingPage/LandingPage';
import StudentInputForm from './components/StudentInputForm/StudentInputForm';
import AptitudeTest from './components/AptitudeTest/AptitudeTest';
import CalculateResult from './components/CalculateResult/CalculateResult';
import CareerRecommendation from './components/CareerRecommendation/CareerRecommendation';
import ChallengeIntro from './components/CareerChallenge/ChallengeIntro'; // Import these
import DailyTask from './components/CareerChallenge/DailyTask';
import PerformanceTracker from './components/CareerChallenge/PerformanceTracker';
import { calculateResults } from './utils/calculateResults';

export default function App() {
  const [step, setStep] = useState(0);
  const [studentData, setStudentData] = useState(null);
  const [aptitudeAnswers, setAptitudeAnswers] = useState(null);
  const [results, setResults] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  // State for Career Challenge navigation
  const [challengeDay, setChallengeDay] = useState(1);
  const [completedDays, setCompletedDays] = useState([]);

  // Step 0: Landing page
  const handleStart = () => {
    setStep(1);
  };

  // Step 1: Student form submission
  const handleStudentSubmit = (data) => {
    setStudentData(data);
    setStep(2);
  };

  // Step 2: Aptitude test completion
  const handleAptitudeComplete = (answers) => {
    setAptitudeAnswers(answers);
    const computedResults = calculateResults(answers);
    setResults(computedResults);
    setStep(3);
  };

  // Step 3: After viewing results, move to career recommendations
  const handleCalculationNext = () => {
    const recs = results?.recommendations || [];
    const careerNames = recs.map((r) => (typeof r === 'string' ? r : r.career));
    setRecommendations(careerNames);
    setStep(4);
  };

  // Step 4: Accept roadmap action
  const handleAcceptRoadmap = () => {
    alert('Career roadmap accepted!');
  };

  // Step 4: Take career challenge action -> start career challenge flow
  const handleTakeChallenge = () => {
    setChallengeDay(1);
    setCompletedDays([]);
    setStep(5);
  };

  // Cancel button: go back to Landing page
  const handleCancel = () => {
    setStep(0);
  };

  // Career Challenge handlers for DailyTask navigation and completion
  const handleStartChallenge = () => {
    setStep(6);
  };

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

  return (
    <>
      {step === 0 && <LandingPage onStart={handleStart} />}
      {step === 1 && <StudentInputForm onSubmit={handleStudentSubmit} />}
      {step === 2 && <AptitudeTest onComplete={handleAptitudeComplete} />}
      {step === 3 && <CalculateResult results={results} onNext={handleCalculationNext} />}
      {step === 4 && (
        <CareerRecommendation
          recommendations={recommendations}
          onAccept={handleAcceptRoadmap}
          onChallenge={handleTakeChallenge}
          onCancel={handleCancel}
        />
      )}
      {step === 5 && <ChallengeIntro onStart={handleStartChallenge} />}
      {step === 6 && (
        <DailyTask
          day={challengeDay}
          onComplete={handleCompleteTask}
          onPrev={handlePrevTask}
        />
      )}
      {step === 7 && <PerformanceTracker completedDays={completedDays} />}
    </>
  );
}
