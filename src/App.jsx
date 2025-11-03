import React, { useState, useEffect } from 'react';
import { BookOpen, Brain, CheckCircle, Edit3, Sparkles, TrendingUp, Zap, Trash2, RotateCw, Award } from 'lucide-react';

export default function AIStudyBuddy() {
  const [activeTab, setActiveTab] = useState('input');
  const [studyNotes, setStudyNotes] = useState('');
  const [topic, setTopic] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [studyTips, setStudyTips] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [savedTopics, setSavedTopics] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const result = await window.storage.list('study-topic:');
      if (result && result.keys) {
        const topics = await Promise.all(
          result.keys.map(async (key) => {
            const data = await window.storage.get(key);
            return data ? JSON.parse(data.value) : null;
          })
        );
        setSavedTopics(topics.filter(t => t !== null));
      }
    } catch (error) {
      console.log('No saved topics yet');
    }
  };

  const generateFlashcards = (notes, topicName) => {
    const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const cards = [];
    
    for (let i = 0; i < Math.min(8, sentences.length); i++) {
      const sentence = sentences[i].trim();
      const words = sentence.split(' ');
      
      if (words.length > 5) {
        const keyPhrase = words.slice(0, Math.ceil(words.length / 2)).join(' ');
        const answer = words.slice(Math.ceil(words.length / 2)).join(' ');
        
        cards.push({
          question: `What follows: "${keyPhrase}..."?`,
          answer: answer,
          topic: topicName
        });
      }
    }
    
    const keywords = notes.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    keywords.slice(0, 4).forEach(keyword => {
      cards.push({
        question: `Define or explain: ${keyword}`,
        answer: `Key concept from ${topicName} - Review your notes for details about ${keyword}.`,
        topic: topicName
      });
    });
    
    return cards.slice(0, 10);
  };

  const generateQuiz = (notes, topicName) => {
    const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const questions = [];
    
    const questionTemplates = [
      { prefix: 'What is the main idea of', type: 'open' },
      { prefix: 'Explain the concept of', type: 'open' },
      { prefix: 'Which statement is true about', type: 'mcq' },
      { prefix: 'What is the relationship between', type: 'open' },
    ];
    
    for (let i = 0; i < Math.min(5, sentences.length); i++) {
      const template = questionTemplates[i % questionTemplates.length];
      const sentence = sentences[i].trim();
      const words = sentence.split(' ');
      const keyTerm = words.find(w => w.length > 5) || topicName;
      
      if (template.type === 'mcq') {
        questions.push({
          question: `${template.prefix} ${keyTerm}?`,
          options: [
            sentence.slice(0, 50) + '...',
            'This is an incorrect option',
            'Another incorrect option',
            'Yet another incorrect option'
          ].sort(() => Math.random() - 0.5),
          correctAnswer: 0,
          type: 'mcq'
        });
      } else {
        questions.push({
          question: `${template.prefix} ${keyTerm}?`,
          answer: sentence,
          type: 'open'
        });
      }
    }
    
    return questions;
  };

  const generateStudyTips = (notes, topicName) => {
    const tips = [
      {
        icon: '🎯',
        title: 'Active Recall',
        tip: `Try to explain ${topicName} without looking at your notes. This strengthens memory retention.`
      },
      {
        icon: '⏰',
        title: 'Spaced Repetition',
        tip: 'Review this material after 1 day, 3 days, then 1 week for optimal retention.'
      },
      {
        icon: '✍️',
        title: 'Practice Application',
        tip: `Create real-world examples of how ${topicName} applies to situations you know.`
      },
      {
        icon: '🧩',
        title: 'Connect Concepts',
        tip: `Link ${topicName} to other topics you've learned. Building connections improves understanding.`
      },
      {
        icon: '👥',
        title: 'Teach Someone',
        tip: `Explain ${topicName} to a friend or family member. Teaching is the best way to learn.`
      }
    ];
    
    return tips;
  };

  const handleGenerate = async () => {
    if (!studyNotes.trim() || !topic.trim()) {
      alert('Please enter both topic name and study notes!');
      return;
    }

    setIsGenerating(true);
    
    setTimeout(async () => {
      const cards = generateFlashcards(studyNotes, topic);
      const quiz = generateQuiz(studyNotes, topic);
      const tips = generateStudyTips(studyNotes, topic);
      
      setFlashcards(cards);
      setQuizQuestions(quiz);
      setStudyTips(tips);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setQuizAnswers({});
      setShowResults(false);
      
      const topicData = {
        id: Date.now().toString(),
        topic,
        notes: studyNotes,
        flashcards: cards,
        quizQuestions: quiz,
        studyTips: tips,
        createdAt: new Date().toISOString()
      };
      
      try {
        await window.storage.set(`study-topic:${topicData.id}`, JSON.stringify(topicData));
        await loadSavedData();
      } catch (error) {
        console.log('Storage not available, data will be session-only');
      }
      
      setIsGenerating(false);
      setActiveTab('flashcards');
    }, 1500);
  };

  const loadTopic = (topicData) => {
    setTopic(topicData.topic);
    setStudyNotes(topicData.notes);
    setFlashcards(topicData.flashcards);
    setQuizQuestions(topicData.quizQuestions);
    setStudyTips(topicData.studyTips);
    setActiveTab('flashcards');
  };

  const deleteTopic = async (id) => {
    try {
      await window.storage.delete(`study-topic:${id}`);
      await loadSavedData();
    } catch (error) {
      console.log('Could not delete topic');
    }
  };

  const submitQuiz = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    quizQuestions.forEach((q, idx) => {
      if (q.type === 'mcq' && quizAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-10 h-10" />
            <h1 className="text-3xl font-bold">AI Study Buddy</h1>
          </div>
          <p className="text-purple-100">Your intelligent learning companion powered by AI</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'input', label: 'Create', icon: Edit3 },
              { id: 'flashcards', label: 'Flashcards', icon: BookOpen },
              { id: 'quiz', label: 'Quiz', icon: CheckCircle },
              { id: 'tips', label: 'Study Tips', icon: Sparkles },
              { id: 'saved', label: 'My Topics', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        
        {/* Input Tab */}
        {activeTab === 'input' && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-8 h-8 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-800">Create Study Materials</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Topic Name
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis, World War II, Python Functions"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Study Notes
                </label>
                <textarea
                  value={studyNotes}
                  onChange={(e) => setStudyNotes(e.target.value)}
                  placeholder="Paste your notes here... The more detailed, the better the AI can help you study!"
                  rows={12}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">
                  💡 Tip: Include definitions, explanations, and key concepts for best results
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="w-5 h-5 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Study Materials
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Flashcards Tab */}
        {activeTab === 'flashcards' && (
          <div className="space-y-6">
            {flashcards.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No flashcards yet</h3>
                <p className="text-gray-500">Create study materials first to generate flashcards</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Flashcards</h2>
                    <span className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                      {currentCardIndex + 1} / {flashcards.length}
                    </span>
                  </div>

                  <div 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="relative h-64 md:h-80 cursor-pointer perspective-1000"
                  >
                    <div className={`absolute inset-0 transition-all duration-500 transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                      {/* Front of card */}
                      <div className={`absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-xl p-8 flex items-center justify-center ${isFlipped ? 'invisible' : 'visible'}`}>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-purple-100 mb-3">QUESTION</p>
                          <p className="text-xl md:text-2xl font-bold text-white">
                            {flashcards[currentCardIndex].question}
                          </p>
                          <p className="text-sm text-purple-200 mt-6">Tap to reveal answer</p>
                        </div>
                      </div>
                      
                      {/* Back of card */}
                      <div className={`absolute inset-0 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl shadow-xl p-8 flex items-center justify-center transform rotate-y-180 ${isFlipped ? 'visible' : 'invisible'}`}>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-green-100 mb-3">ANSWER</p>
                          <p className="text-xl md:text-2xl font-bold text-white">
                            {flashcards[currentCardIndex].answer}
                          </p>
                          <p className="text-sm text-green-200 mt-6">Tap to see question</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setCurrentCardIndex(Math.max(0, currentCardIndex - 1));
                        setIsFlipped(false);
                      }}
                      disabled={currentCardIndex === 0}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50 transition-all"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => {
                        setCurrentCardIndex(Math.min(flashcards.length - 1, currentCardIndex + 1));
                        setIsFlipped(false);
                      }}
                      disabled={currentCardIndex === flashcards.length - 1}
                      className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 transition-all"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            {quizQuestions.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No quiz yet</h3>
                <p className="text-gray-500">Create study materials first to generate a quiz</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-8 h-8 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Practice Quiz</h2>
                </div>

                <div className="space-y-6">
                  {quizQuestions.map((q, idx) => (
                    <div key={idx} className="border-2 border-gray-200 rounded-lg p-6">
                      <p className="font-semibold text-gray-800 mb-4">
                        {idx + 1}. {q.question}
                      </p>
                      
                      {q.type === 'mcq' ? (
                        <div className="space-y-2">
                          {q.options.map((option, optIdx) => (
                            <label
                              key={optIdx}
                              className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                quizAnswers[idx] === optIdx
                                  ? 'border-purple-600 bg-purple-50'
                                  : 'border-gray-200 hover:border-purple-300'
                              } ${
                                showResults && optIdx === q.correctAnswer
                                  ? 'bg-green-100 border-green-500'
                                  : ''
                              } ${
                                showResults && quizAnswers[idx] === optIdx && optIdx !== q.correctAnswer
                                  ? 'bg-red-100 border-red-500'
                                  : ''
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${idx}`}
                                checked={quizAnswers[idx] === optIdx}
                                onChange={() => !showResults && setQuizAnswers({...quizAnswers, [idx]: optIdx})}
                                disabled={showResults}
                                className="mr-3"
                              />
                              {option}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <textarea
                            value={quizAnswers[idx] || ''}
                            onChange={(e) => setQuizAnswers({...quizAnswers, [idx]: e.target.value})}
                            disabled={showResults}
                            placeholder="Type your answer here..."
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                          />
                          {showResults && (
                            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm font-semibold text-blue-800 mb-1">Sample Answer:</p>
                              <p className="text-sm text-blue-700">{q.answer}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!showResults ? (
                  <button
                    onClick={submitQuiz}
                    className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="w-8 h-8 text-green-600" />
                      <h3 className="text-2xl font-bold text-gray-800">Quiz Complete!</h3>
                    </div>
                    <p className="text-lg text-gray-700">
                      You got <span className="font-bold text-green-600">{calculateScore()}</span> out of{' '}
                      <span className="font-bold">{quizQuestions.filter(q => q.type === 'mcq').length}</span> multiple choice questions correct!
                    </p>
                    <button
                      onClick={() => {
                        setShowResults(false);
                        setQuizAnswers({});
                      }}
                      className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                    >
                      Retake Quiz
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Study Tips Tab */}
        {activeTab === 'tips' && (
          <div className="space-y-4">
            {studyTips.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No study tips yet</h3>
                <p className="text-gray-500">Create study materials first to get personalized tips</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                    <h2 className="text-2xl font-bold text-gray-800">AI-Powered Study Tips</h2>
                  </div>
                  <p className="text-gray-600 mt-2">Personalized recommendations to boost your learning</p>
                </div>

                {studyTips.map((tip, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{tip.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{tip.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{tip.tip}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Saved Topics Tab */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-800">My Study Topics</h2>
              </div>
              <p className="text-gray-600 mt-2">Access your previously created study materials</p>
            </div>

            {savedTopics.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No saved topics yet</h3>
                <p className="text-gray-500">Create your first study material to see it here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {savedTopics.map((topicData) => (
                  <div key={topicData.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{topicData.topic}</h3>
                        <p className="text-sm text-gray-500 mb-3">
                          Created: {new Date(topicData.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                            {topicData.flashcards.length} flashcards
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                            {topicData.quizQuestions.length} quiz questions
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                            {topicData.studyTips.length} study tips
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => loadTopic(topicData)}
                          className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg transition-all"
                          title="Load topic"
                        >
                          <BookOpen className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteTopic(topicData.id)}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                          title="Delete topic"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-gray-300 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">Built with ❤️ using AI-powered coding • Study smarter, not harder</p>
        </div>
      </div>
    </div>
  );
}