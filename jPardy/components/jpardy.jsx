'use client'

import React, { useState, useEffect } from 'react';
import { Star, X, Save, FolderOpen } from 'lucide-react';

const JeopardyGame = () => {
  const defaultCategories = Array(6).fill('');
  const defaultQuestions = Array(6).fill().map(() => 
    Array(5).fill().map((_, index) => ({
      question: '',
      answer: '',
      explanation: '',
      explanationImage: '',
      questionImage: '',
      answerImage: '',
      points: (index + 1) * 100,
      revealed: false,
      isDaily: false
    }))
  );
  const defaultTeamNames = ['Team 1', 'Team 2'];

  const [gameState, setGameState] = useState('setup'); // setup, play
  const [categories, setCategories] = useState(defaultCategories);
  const [questions, setQuestions] = useState(defaultQuestions);
  const [scores, setScores] = useState([0, 0]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [wagerAmount, setWagerAmount] = useState(0);
  const [showWager, setShowWager] = useState(false);
  const [gameName, setGameName] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [teamNames, setTeamNames] = useState(defaultTeamNames);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(null);
  const [numCategories, setNumCategories] = useState(6);
  const [gameComplete, setGameComplete] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [traditionalMode, setTraditionalMode] = useState(false);
  const [scoredQuestions, setScoredQuestions] = useState(new Set());
  const [scoredHistory, setScoredHistory] = useState(new Map());
  const [editingExplanations, setEditingExplanations] = useState(new Set());
  const [showTeamSelect, setShowTeamSelect] = useState(false);
  const [selectedTeamForDD, setSelectedTeamForDD] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isStealMode, setIsStealMode] = useState(false);
  const [stealFromTeamIndex, setStealFromTeamIndex] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  const handleCategoryChange = (index, value) => {
    const newCategories = [...categories];
    newCategories[index] = value;
    setCategories(newCategories);
  };

  const handleQuestionChange = (categoryIndex, questionIndex, field, value) => {
    const newQuestions = [...questions];
    if (field === 'isDaily') {
      newQuestions[categoryIndex][questionIndex][field] = !newQuestions[categoryIndex][questionIndex][field];
    } else {
      newQuestions[categoryIndex][questionIndex][field] = field === 'points' && value ? parseInt(value) : value;
    }
    setQuestions(newQuestions);
  };

  const handleImageUpload = async (categoryIndex, questionIndex, field, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target.result;
        handleQuestionChange(categoryIndex, questionIndex, field, base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveGame = async () => {
    const gameData = {
      categories,
      questions: questions.map(categoryQuestions => 
        categoryQuestions.map(q => ({
          ...q,
          revealed: false
        }))
      ),
      name: gameName || 'Untitled Game',
      images: questions.map(categoryQuestions =>
        categoryQuestions.map(q => ({
          questionImage: q.questionImage || '',
          answerImage: q.answerImage || '',
          explanationImage: q.explanationImage || ''
        }))
      )
    };

    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: `${gameData.name.replace(/\s+/g, '_')}.json`,
        types: [{
          description: 'JSON Files',
          accept: {
            'application/json': ['.json'],
          },
        }],
      });
      
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(gameData, null, 2));
      await writable.close();
    } catch (err) {
      // If the browser doesn't support showSaveFilePicker or user cancels, fall back to default behavior
      if (err.name !== 'AbortError') {
        const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${gameData.name.replace(/\s+/g, '_')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }
  };

  const loadGame = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const gameData = JSON.parse(e.target.result);
          setCategories(gameData.categories);
          
          if (gameData.images) {
            const mergedQuestions = gameData.questions.map((categoryQuestions, catIndex) =>
              categoryQuestions.map((q, qIndex) => ({
                ...q,
                questionImage: gameData.images[catIndex][qIndex].questionImage || '',
                answerImage: gameData.images[catIndex][qIndex].answerImage || '',
                explanationImage: gameData.images[catIndex][qIndex].explanationImage || ''
              }))
            );
            setQuestions(mergedQuestions);
          } else {
            setQuestions(gameData.questions);
          }
          
          setGameName(gameData.name);
          setGameState('setup');
          setScores([0, 0]);
          setCurrentQuestion(null);
          setShowAnswer(false);
          setWagerAmount(0);
          setShowWager(false);
          setScoredQuestions(new Set());
        } catch (error) {
          alert('Error loading game file');
          console.error('Error loading game:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const startGame = () => {
    setGameState('play');
    const resetQuestions = questions.map(category =>
      category.map(question => ({
        ...question,
        revealed: false
      }))
    );
    setQuestions(resetQuestions);
    setScores(Array(teamNames.length).fill(0));
    setCurrentQuestion(null);
    setShowAnswer(false);
    setWagerAmount(0);
    setShowWager(false);
    setGameComplete(false);
    setWinner(null);
    setShowExplanation(false);
    setScoredQuestions(new Set());
    setScoredHistory(new Map());
  };

  const revealQuestion = (categoryIndex, questionIndex) => {
    const question = questions[categoryIndex][questionIndex];
    if (question.isDaily) {
      setCurrentQuestion({
        ...question,
        categoryIndex,
        questionIndex,
        originalPoints: question.points
      });
      setShowTeamSelect(true);
    } else {
      setCurrentQuestion({
        ...question,
        categoryIndex,
        questionIndex,
        originalPoints: question.points
      });
      const newQuestions = [...questions];
      newQuestions[categoryIndex][questionIndex].revealed = true;
      setQuestions(newQuestions);
      setShowAnswer(false);
    }
  };

  const confirmWager = () => {
    const maxWager = Math.max(Math.abs(Math.max(...scores)), currentQuestion.originalPoints * 2);
    const validWager = Math.min(Math.max(5, wagerAmount), maxWager);
    
    setShowWager(false);
    setShowAnswer(false);
    setCurrentQuestion(prev => ({
      ...prev,
      points: validWager,
      isWager: true
    }));
    
    // Mark question as revealed
    const newQuestions = [...questions];
    newQuestions[currentQuestion.categoryIndex][currentQuestion.questionIndex].revealed = true;
    setQuestions(newQuestions);
  };

  const addTeam = () => {
    setTeamNames([...teamNames, `Team ${teamNames.length + 1}`]);
    setScores([...scores, 0]);
  };

  const removeTeam = () => {
    if (teamNames.length > 2) {
      setTeamNames(teamNames.slice(0, -1));
      setScores(scores.slice(0, -1));
    }
  };

  const handlePointsUpdate = (playerIndex, isCorrect, stealFromIndex = null) => {
    if (currentQuestion) {
      const newScores = [...scores];
      const questionKey = `${currentQuestion.categoryIndex}-${currentQuestion.questionIndex}`;
      
      if (scoredHistory.has(questionKey)) {
        const previousScore = scoredHistory.get(questionKey);
        newScores[previousScore.playerIndex] -= previousScore.points;
      }
      
      let pointsChange;
      if (currentQuestion.isWager) {
        if (playerIndex === selectedTeamForDD) {
          pointsChange = isCorrect ? currentQuestion.points * 2 : -currentQuestion.points;
        } else {
          pointsChange = isCorrect ? currentQuestion.originalPoints : -currentQuestion.originalPoints;
          if (isCorrect) {
            newScores[selectedTeamForDD] -= currentQuestion.points;
            setScoredHistory(new Map(scoredHistory.set(`${questionKey}-wager`, {
              playerIndex: selectedTeamForDD,
              points: -currentQuestion.points
            })));
          }
        }
      } else {
        pointsChange = isCorrect ? currentQuestion.points : -currentQuestion.points;
        
        if (isCorrect && stealFromIndex !== null && !currentQuestion.isWager) {
          newScores[stealFromIndex] -= currentQuestion.points;
          setScoredHistory(new Map(scoredHistory.set(`${questionKey}-steal`, {
            playerIndex: stealFromIndex,
            points: -currentQuestion.points
          })));
        }
      }
      
      newScores[playerIndex] += pointsChange;
      
      setScoredHistory(new Map(scoredHistory.set(questionKey, {
        playerIndex,
        points: pointsChange
      })));
      
      setScores(newScores);
      setScoredQuestions(new Set([...scoredQuestions, questionKey]));
      setCurrentQuestion(null);
      setWagerAmount(0);
      setSelectedTeamForDD(null);
      setIsStealMode(false);
      setStealFromTeamIndex(null);

      if (scoredQuestions.size + 1 === categories.length * questions[0].length) {
        const maxScore = Math.max(...newScores);
        const winnerIndex = newScores.findIndex(score => score === maxScore);
        setWinner({
          name: teamNames[winnerIndex],
          score: maxScore
        });
        setGameComplete(true);
      }
    }
  };

  const handleNumCategoriesChange = (value) => {
    const newCategories = [...categories];
    const newQuestions = [...questions];

    if (value > categories.length) {
      for (let i = categories.length; i < value; i++) {
        newCategories.push('');
        newQuestions.push(Array(5).fill().map((_, index) => ({
          question: '',
          answer: '',
          explanation: '',
          explanationImage: '',
          questionImage: '',
          answerImage: '',
          points: (index + 1) * 100,
          revealed: false,
          isDaily: false
        })));
      }
    } else {
      newCategories.length = value;
      newQuestions.length = value;
    }

    setCategories(newCategories);
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    const newQuestions = questions.map((categoryQuestions) => {
      const newQuestionIndex = categoryQuestions.length;
      return [
        ...categoryQuestions,
        {
          question: '',
          answer: '',
          explanation: '',
          explanationImage: '',
          questionImage: '',
          answerImage: '',
          points: (newQuestionIndex + 1) * 100,
          revealed: false,
          isDaily: false
        }
      ];
    });
    setQuestions(newQuestions);
  };

  const removeQuestion = () => {
    const newQuestions = questions.map((categoryQuestions) => {
      if (categoryQuestions.length > 1) {
        return categoryQuestions.slice(0, -1);
      }
      return categoryQuestions;
    });
    setQuestions(newQuestions);
  };

  const addCategory = () => {
    setCategories([...categories, '']);
    setQuestions([...questions, Array(5).fill().map((_, index) => ({
      question: '',
      answer: '',
      explanation: '',
      explanationImage: '',
      questionImage: '',
      answerImage: '',
      points: (index + 1) * 100,
      revealed: false,
      isDaily: false
    }))]);
  };

  const removeCategory = () => {
    if (categories.length > 1) {
      setCategories(categories.slice(0, -1));
      setQuestions(questions.slice(0, -1));
    }
  };

  const resetToDefaults = () => {
    setCategories([...defaultCategories]);
    setQuestions([...defaultQuestions]);
    setTeamNames([...defaultTeamNames]);
    setNumCategories(6);
    setGameName('');
    setSelectedCategoryIndex(null);
  };

  const handleScoreEdit = (teamIndex, newScore) => {
    const newScores = [...scores];
    newScores[teamIndex] = newScore === '' ? 0 : Number(newScore);
    setScores(newScores);
  };

  const exportAnswersMarkdown = () => {
    let content = `# ${gameName || 'Untitled Game'} - Answer Sheet\n\n`;

    content += '| Points |';
    categories.forEach(category => {
      content += ` ${category || 'Category'} |`;
    });
    content += '\n';

    content += '|---------|';
    categories.forEach(() => {
      content += '---------|';
    });
    content += '\n';

    const formatText = (text) => {
      // Replace newlines with <br> and handle list formatting
      return text
        .replace(/\n/g, '<br>')  // Replace newlines with HTML line breaks
        .replace(/(\d+[\)\.]) /g, '$1&nbsp;') // Keep list numbers with their items
        .replace(/\|/g, '\\|'); // Escape pipe characters
    };

    const numQuestions = questions[0].length;
    for (let questionIndex = 0; questionIndex < numQuestions; questionIndex++) {
      content += `| ${(questionIndex + 1) * 100} |`;
      categories.forEach((_, categoryIndex) => {
        const q = questions[categoryIndex][questionIndex];
        content += ` Q: ${formatText(q.question)} |`;
      });
      content += '\n';

      content += '| *Answers* |';
      categories.forEach((_, categoryIndex) => {
        const q = questions[categoryIndex][questionIndex];
        content += ` A: ${formatText(q.answer)} |`;
      });
      content += '\n';
    }

    return { content, extension: 'md' };
  };

  const exportAnswersText = () => {
    let content = `${gameName || 'Untitled Game'} - Answer Sheet\n\n`;

    categories.forEach((category, categoryIndex) => {
      content += `${category || `Category ${categoryIndex + 1}`}\n`;
      content += '----------------------------------------\n';
      
      questions[categoryIndex].forEach((q, questionIndex) => {
        content += `${q.points} points:\n`;
        content += `Question: ${q.question}\n`;
        content += `Answer: ${q.answer}\n\n`;
      });
      content += '\n';
    });

    return { content, extension: 'txt' };
  };

  const exportAnswersCSV = () => {
    const rows = [];
    
    rows.push(['Points', ...categories]);
    
    const numQuestions = questions[0].length;
    for (let questionIndex = 0; questionIndex < numQuestions; questionIndex++) {
      const questionRow = [`${(questionIndex + 1) * 100} - Question`];
      const answerRow = [`${(questionIndex + 1) * 100} - Answer`];
      
      categories.forEach((_, categoryIndex) => {
        const q = questions[categoryIndex][questionIndex];
        questionRow.push(q.question);
        answerRow.push(q.answer);
      });
      
      rows.push(questionRow, answerRow);
    }
    
    const content = rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`)
      .join(',')
    ).join('\n');

    return { content, extension: 'csv' };
  };

  const exportAnswers = (format) => {
    let exportData;
    
    switch (format) {
      case 'markdown':
        exportData = exportAnswersMarkdown();
        break;
      case 'csv':
        exportData = exportAnswersCSV();
        break;
      case 'text':
      default:
        exportData = exportAnswersText();
        break;
    }

    const blob = new Blob([exportData.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(gameName || 'Untitled_Game').replace(/\s+/g, '_')}_answers.${exportData.extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleExplanationEdit = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    const newEditing = new Set(editingExplanations);
    if (newEditing.has(key)) {
      newEditing.delete(key);
    } else {
      newEditing.add(key);
    }
    setEditingExplanations(newEditing);
  };

  if (gameState === 'setup') {
    return (
      <div className={`max-w-6xl mx-auto p-4 ${darkMode ? 'bg-black' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>Game Setup</h2>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <span>Traditional Mode</span>
                <div
                  onClick={() => setTraditionalMode(!traditionalMode)}
                  className={`relative w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${
                    traditionalMode ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`absolute w-4 h-4 transition-transform duration-200 ease-in-out transform bg-white rounded-full top-1 ${
                      traditionalMode ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </div>
              </label>
            </div>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Game Name"
              className={`px-2 py-1 border rounded ${
                darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black'
              }`}
            />
            <button
              onClick={saveGame}
              className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              <Save className="h-4 w-4" />
              Save Game
            </button>
            <label className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">
              <FolderOpen className="h-4 w-4" />
              Load Game
              <input
                type="file"
                accept=".json"
                onChange={loadGame}
                className="hidden"
              />
            </label>
            <div className="relative inline-block">
              <button
                className="flex items-center gap-1 px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                onClick={(e) => {
                  const dropdown = e.currentTarget.nextElementSibling;
                  if (dropdown) {
                    dropdown.classList.toggle('hidden');
                  }
                }}
                onBlur={(e) => {
                  setTimeout(() => {
                    const dropdown = e.currentTarget.nextElementSibling;
                    if (dropdown && !dropdown.contains(document.activeElement)) {
                      dropdown.classList.add('hidden');
                    }
                  }, 200);
                }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Answers
              </button>
              <div className="absolute left-0 mt-1 bg-white border rounded shadow-lg z-50 hidden">
                <button
                  onClick={() => {
                    exportAnswers('markdown');
                    const dropdown = document.querySelector('.export-dropdown');
                    if (dropdown) dropdown.classList.add('hidden');
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                >
                  Export as Markdown (.md)
                </button>
                <button
                  onClick={() => {
                    exportAnswers('text');
                    const dropdown = document.querySelector('.export-dropdown');
                    if (dropdown) dropdown.classList.add('hidden');
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                >
                  Export as Text (.txt)
                </button>
                <button
                  onClick={() => {
                    exportAnswers('csv');
                    const dropdown = document.querySelector('.export-dropdown');
                    if (dropdown) dropdown.classList.add('hidden');
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                >
                  Export as CSV (.csv)
                </button>
              </div>
            </div>
            <button
              onClick={resetToDefaults}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className={darkMode ? 'text-white' : 'text-black'}>Dark Mode</span>
            <div
              onClick={() => setDarkMode(!darkMode)}
              className={`relative w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${
                darkMode ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            >
              <div
                className={`absolute w-4 h-4 transition-transform duration-200 ease-in-out transform bg-white rounded-full top-1 ${
                  darkMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </div>
          </label>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="grid gap-2 mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Team Names</h3>
              {teamNames.map((name, i) => (
                <input
                  key={`team-${i}`}
                  value={name}
                  onChange={(e) => {
                    const newTeamNames = [...teamNames];
                    newTeamNames[i] = e.target.value;
                    setTeamNames(newTeamNames);
                  }}
                  placeholder={`Team ${i + 1} Name`}
                  className={`w-full p-1 border rounded ${
                    darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black'
                  }`}
                />
              ))}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={addTeam}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Add Team
                </button>
                <button
                  onClick={removeTeam}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Remove Team
                </button>
              </div>
            </div>

            <div className="grid gap-2 mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Categories</h3>
              {categories.map((category, i) => (
                <button
                  key={`category-button-${i}`}
                  onClick={() => setSelectedCategoryIndex(i)}
                  className={`w-full p-1 border rounded ${
                    selectedCategoryIndex === i 
                      ? 'bg-blue-500 text-white' 
                      : darkMode 
                        ? 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700' 
                        : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  {category || `Category ${i + 1}`}
                </button>
              ))}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={addCategory}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Add Category
                </button>
                <button
                  onClick={removeCategory}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Remove Category
                </button>
              </div>
            </div>
          </div>

          {selectedCategoryIndex !== null && (
            <div className="flex-1">
              <div className="grid gap-2 mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                  {categories[selectedCategoryIndex] || `Category ${selectedCategoryIndex + 1}`} Questions
                </h3>
                <input
                  value={categories[selectedCategoryIndex]}
                  onChange={(e) => handleCategoryChange(selectedCategoryIndex, e.target.value)}
                  placeholder={`Category ${selectedCategoryIndex + 1} Name`}
                  className={`w-full p-1 border rounded ${
                    darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black'
                  }`}
                />
                <div className="grid gap-2">
                  {questions[selectedCategoryIndex].map((q, questionIndex) => (
                    <div key={`q-${selectedCategoryIndex}-${questionIndex}`} className="p-2 border rounded">
                      <div className="grid gap-1">
                        <div className="flex items-center gap-2">
                          <input
                            value={q.points}
                            onChange={(e) => handleQuestionChange(selectedCategoryIndex, questionIndex, 'points', e.target.value)}
                            type="number"
                            placeholder="Points"
                            className={`w-20 p-1 border rounded ${
                              darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black'
                            }`}
                          />
                          <button
                            onClick={() => handleQuestionChange(selectedCategoryIndex, questionIndex, 'isDaily')}
                            className={`flex items-center gap-1 px-2 py-1 rounded ${q.isDaily ? 'bg-blue-500 text-white' : 'border'}`}
                          >
                            <Star className="h-4 w-4" />
                            Daily Double
                          </button>
                        </div>
                        <textarea
                          value={q.question}
                          onChange={(e) => handleQuestionChange(selectedCategoryIndex, questionIndex, 'question', e.target.value)}
                          placeholder="Question"
                          className={`w-full p-1 border rounded min-h-[60px] resize-y whitespace-pre-wrap ${
                            darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black'
                          }`}
                          style={{ fontFamily: 'inherit' }}
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex-1">
                            <div className={`w-full p-2 border rounded text-center cursor-pointer ${
                              darkMode ? 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700' : 'bg-white text-black hover:bg-gray-50'
                            }`}>
                              {q.questionImage ? 'Change Question Image' : 'Upload Question Image'}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(selectedCategoryIndex, questionIndex, 'questionImage', e)}
                              className="hidden"
                            />
                          </label>
                          {q.questionImage && (
                            <button
                              onClick={() => handleQuestionChange(selectedCategoryIndex, questionIndex, 'questionImage', '')}
                              className="p-2 text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {q.questionImage && (
                          <div className="relative w-full h-32 bg-gray-100 rounded">
                            <img
                              src={q.questionImage}
                              alt="Question preview"
                              className="absolute inset-0 w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <textarea
                          value={q.answer}
                          onChange={(e) => handleQuestionChange(selectedCategoryIndex, questionIndex, 'answer', e.target.value)}
                          placeholder="Answer"
                          className={`w-full p-1 border rounded min-h-[60px] resize-y whitespace-pre-wrap ${
                            darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black'
                          }`}
                          style={{ fontFamily: 'inherit' }}
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex-1">
                            <div className={`w-full p-2 border rounded text-center cursor-pointer ${
                              darkMode ? 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700' : 'bg-white text-black hover:bg-gray-50'
                            }`}>
                              {q.answerImage ? 'Change Answer Image' : 'Upload Answer Image'}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(selectedCategoryIndex, questionIndex, 'answerImage', e)}
                              className="hidden"
                            />
                          </label>
                          {q.answerImage && (
                            <button
                              onClick={() => handleQuestionChange(selectedCategoryIndex, questionIndex, 'answerImage', '')}
                              className="p-2 text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {(editingExplanations.has(`${selectedCategoryIndex}-${questionIndex}`) || q.explanation) ? (
                          <>
                            <textarea
                              value={q.explanation}
                              onChange={(e) => handleQuestionChange(selectedCategoryIndex, questionIndex, 'explanation', e.target.value)}
                              placeholder="Explanation (optional)"
                              className={`w-full p-1 border rounded min-h-[60px] resize-y whitespace-pre-wrap ${
                                darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black'
                              }`}
                            />
                            <div className="flex items-center gap-2">
                              <label className="flex-1">
                                <div className={`w-full p-2 border rounded text-center cursor-pointer ${
                                  darkMode ? 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700' : 'bg-white text-black hover:bg-gray-50'
                                }`}>
                                  {q.explanationImage ? 'Change Explanation Image' : 'Upload Explanation Image'}
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(selectedCategoryIndex, questionIndex, 'explanationImage', e)}
                                  className="hidden"
                                />
                              </label>
                              {q.explanationImage && (
                                <button
                                  onClick={() => handleQuestionChange(selectedCategoryIndex, questionIndex, 'explanationImage', '')}
                                  className="p-2 text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            {q.explanationImage && (
                              <div className="relative w-full h-32 bg-gray-100 rounded">
                                <img
                                  src={q.explanationImage}
                                  alt="Explanation preview"
                                  className="absolute inset-0 w-full h-full object-contain"
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => toggleExplanationEdit(selectedCategoryIndex, questionIndex)}
                            className="w-full p-1 border rounded text-gray-600 hover:bg-gray-50"
                          >
                            + Add Explanation
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={addQuestion}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Add Question
                  </button>
                  <button
                    onClick={removeQuestion}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Remove Question
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={startGame} 
          className="w-full bg-blue-500 text-white py-1 rounded hover:bg-blue-600"
        >
          Start Game
        </button>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto p-4 ${darkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>{gameName || 'Untitled Game'}</h2>
        <button
          onClick={() => setGameState('setup')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Setup
        </button>
      </div>

      <div className="flex justify-between mb-4">
        {teamNames.map((name, index) => (
          <div key={`score-${index}`} className={`text-xl flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
            {name}:
            <input
              type="number"
              value={scores[index]}
              onChange={(e) => handleScoreEdit(index, e.target.value)}
              className={`w-24 px-2 py-1 border rounded ${
                darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black'
              }`}
              placeholder="Score"
              min={-99999}
            />
            points
          </div>
        ))}
      </div>

      <div className="grid grid-cols-6 gap-4 mb-8">
        {categories.map((category, categoryIndex) => (
          <div key={`category-${categoryIndex}`} className="text-center">
            <div className="font-bold p-2 bg-blue-950 text-white rounded h-24 flex items-center justify-center overflow-hidden">
              <p className="text-sm sm:text-base md:text-lg line-clamp-3 px-2">
                {category}
              </p>
            </div>
            {questions[categoryIndex].map((question, questionIndex) => {
              const questionKey = `${categoryIndex}-${questionIndex}`;
              const isScored = scoredQuestions.has(questionKey);
              
              return (
                <button
                  key={`q-${categoryIndex}-${questionIndex}`}
                  onClick={() => revealQuestion(categoryIndex, questionIndex)}
                  className={`h-24 w-full mt-2 ${
                    isScored ? 'bg-gray-400' : 'bg-blue-500'
                  } rounded hover:${
                    isScored ? 'bg-gray-500' : 'bg-blue-600'
                  } text-yellow-300 font-bold`}
                >
                  {question.points}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {gameComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Game Complete!</h2>
            <p className="text-xl mb-4">Winner: {winner.name}</p>
            <p className="text-2xl mb-6">Final Score: {winner.score} points</p>
            <button
              onClick={() => setGameState('setup')}
              className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
            >
              Back to Setup
            </button>
          </div>
        </div>
      )}

      {currentQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className={`${
            darkMode ? 'bg-gray-900' : 'bg-white'
          } rounded-lg w-full max-w-4xl`}>
            <div className="p-6">
              {showTeamSelect ? (
                <div className="space-y-8 text-center">
                  <h3 className="text-4xl font-bold text-blue-600 animate-bounce">Daily Double!</h3>
                  <p className="text-xl">Select the team that triggered this Daily Double:</p>
                  <div className="grid grid-cols-2 gap-4">
                    {teamNames.map((name, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (scores[index] >= 5) {
                            setSelectedTeamForDD(index);
                            setShowTeamSelect(false);
                            setShowWager(true);
                          } else {
                            setSelectedTeamForDD(index);
                            setShowTeamSelect(false);
                          }
                          const newQuestions = [...questions];
                          newQuestions[currentQuestion.categoryIndex][currentQuestion.questionIndex].revealed = true;
                          setQuestions(newQuestions);
                        }}
                        className="p-4 text-center border rounded hover:bg-blue-50"
                      >
                        {name} ({scores[index]} points)
                      </button>
                    ))}
                  </div>
                </div>
              ) : showWager ? (
                <div className="space-y-8 text-center">
                  <h3 className="text-4xl font-bold text-blue-600">Daily Double!</h3>
                  <p className="text-xl">{teamNames[selectedTeamForDD]}, make your wager:</p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Minimum: 5 points
                      <br />
                      Maximum: {scores[selectedTeamForDD]} points
                    </p>
                    <input
                      type="number"
                      value={wagerAmount || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                        const maxWager = scores[selectedTeamForDD];
                        setWagerAmount(Math.min(Math.max(value, 0), maxWager));
                      }}
                      min={5}
                      max={scores[selectedTeamForDD]}
                      className={`w-full p-2 border rounded ${
                        darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black'
                      }`}
                      placeholder="Enter wager amount"
                    />
                  </div>
                  <button 
                    onClick={confirmWager}
                    disabled={wagerAmount < 5}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {wagerAmount < 5 ? 'Minimum wager is 5 points' : 'Confirm Wager'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between mb-4">
                    <h3 className="text-xl font-bold">For {currentQuestion.points} points</h3>
                    <button
                      onClick={() => setCurrentQuestion(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="text-center py-12">
                    {traditionalMode ? (
                      showAnswer ? (
                        <div>
                          <p className="text-4xl font-bold mb-8 whitespace-pre-wrap">{currentQuestion.question}</p>
                          {currentQuestion.questionImage && (
                            <img 
                              src={currentQuestion.questionImage} 
                              alt="Question visual"
                              className="max-w-md mx-auto mb-8"
                            />
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-4xl font-bold mb-8 whitespace-pre-wrap">{currentQuestion.answer}</p>
                          {currentQuestion.answerImage && (
                            <img 
                              src={currentQuestion.answerImage} 
                              alt="Answer visual"
                              className="max-w-md mx-auto mb-8"
                            />
                          )}
                        </div>
                      )
                    ) : (
                      showAnswer ? (
                        <div>
                          <p className="text-4xl font-bold mb-8 whitespace-pre-wrap">{currentQuestion.answer}</p>
                          {currentQuestion.answerImage && (
                            <img 
                              src={currentQuestion.answerImage} 
                              alt="Answer visual"
                              className="max-w-md mx-auto mb-8"
                            />
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-4xl font-bold mb-8 whitespace-pre-wrap">{currentQuestion.question}</p>
                          {currentQuestion.questionImage && (
                            <img 
                              src={currentQuestion.questionImage} 
                              alt="Question visual"
                              className="max-w-md mx-auto mb-8"
                            />
                          )}
                        </div>
                      )
                    )}
                  </div>
                  
                  {currentQuestion.explanation && showExplanation && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                          <div className="flex justify-between mb-4">
                            <h3 className="text-xl font-bold">Explanation</h3>
                            <button
                              onClick={() => setShowExplanation(false)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="space-y-4">
                            <p className="text-lg whitespace-pre-wrap">{currentQuestion.explanation}</p>
                            {currentQuestion.explanationImage && (
                              <div className="mt-4">
                                <img 
                                  src={currentQuestion.explanationImage} 
                                  alt="Explanation visual"
                                  className="max-w-full mx-auto"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentQuestion.explanation && (
                    <button 
                      onClick={() => setShowExplanation(!showExplanation)}
                      className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mb-4"
                    >
                      {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
                    </button>
                  )}
                  
                  {!showAnswer && (
                    <button 
                      onClick={() => setShowAnswer(true)}
                      className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
                    >
                      Show {traditionalMode ? 'Question' : 'Answer'}
                    </button>
                  )}

                  {showAnswer && (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <button
                          onClick={() => setIsStealMode(!isStealMode)}
                          className={`flex items-center gap-1 px-3 py-1 rounded ${
                            isStealMode ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Steal
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {teamNames.map((name, index) => (
                          <div key={`team-${index}`}>
                            <h4 className="font-bold mb-2">{name}</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={() => {
                                  if (isStealMode && teamNames.length > 2) {
                                    setStealFromTeamIndex(null);
                                  } else if (isStealMode && teamNames.length === 2) {
                                    const otherTeamIndex = index === 0 ? 1 : 0;
                                    handlePointsUpdate(index, true, otherTeamIndex);
                                  } else {
                                    handlePointsUpdate(index, true);
                                  }
                                }}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                              >
                                Correct
                              </button>
                              <button 
                                onClick={() => handlePointsUpdate(index, false)}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                              >
                                Incorrect
                              </button>
                            </div>
                            
                            {isStealMode && teamNames.length > 2 && stealFromTeamIndex === null && (
                              <div className="mt-2">
                                <select
                                  className={`w-full p-2 border rounded ${
                                    darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black'
                                  }`}
                                  onChange={(e) => {
                                    const stealFrom = parseInt(e.target.value);
                                    if (stealFrom !== index) {
                                      handlePointsUpdate(index, true, stealFrom);
                                    }
                                  }}
                                  value=""
                                >
                                  <option value="" disabled>Select team to steal from</option>
                                  {teamNames.map((teamName, teamIndex) => (
                                    teamIndex !== index && (
                                      <option key={teamIndex} value={teamIndex}>
                                        {teamName}
                                      </option>
                                    )
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JeopardyGame;