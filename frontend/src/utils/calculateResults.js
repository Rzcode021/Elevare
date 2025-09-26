// src/utils/calculateResults.js

export function calculateResults(answers) {
  if (!answers) {
    return {
      recommendations: [],
      summary: 'No answers provided to analyze.'
    };
  }

  const recommendations = [];

  if (answers[1] === 'Math') {
    recommendations.push({ career: 'Data Scientist', confidence: 0.9 });
    recommendations.push({ career: 'Engineer', confidence: 0.85 });
  } else if (answers[1] === 'Arts') {
    recommendations.push({ career: 'Designer', confidence: 0.8 });
    recommendations.push({ career: 'Content Creator', confidence: 0.75 });
  } else {
    recommendations.push({ career: 'Generalist', confidence: 0.5 });
  }

  if (Array.isArray(answers[2]) && answers[2].includes('Coding')) {
    recommendations.push({ career: 'Software Developer', confidence: 0.95 });
  }

  if (typeof answers[3] === 'number' && answers[3] >= 4) {
    recommendations.push({ career: 'Analyst', confidence: 0.7 });
    recommendations.push({ career: 'Research Scientist', confidence: 0.6 });
  }

  // Remove duplicates
  const uniqueRecommendations = recommendations.filter(
    (rec, index, self) => index === self.findIndex(r => r.career === rec.career)
  );

  const careerList = uniqueRecommendations.map((r) => r.career).join(', ') || 'None';

  const summary = `Based on your answers, potential career paths include: ${careerList}.`;

  return {
    recommendations: uniqueRecommendations,
    summary
  };
}
