import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  FileText,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuizManagement = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [consistencyResult, setConsistencyResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Form state for creating new quiz
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [questions, setQuestions] = useState([{
    question_id: "q1",
    question_text: "",
    options: [
      { option_id: "a", text: "" },
      { option_id: "b", text: "" }
    ],
    correct_answer: "a"
  }]);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const response = await axios.get(`${API}/quizzes`);
      setQuizzes(response.data);
    } catch (error) {
      console.error("Error loading quizzes:", error);
    }
  };

  const handleAddQuestion = () => {
    const newQuestionNumber = questions.length + 1;
    setQuestions([
      ...questions,
      {
        question_id: `q${newQuestionNumber}`,
        question_text: "",
        options: [
          { option_id: "a", text: "" },
          { option_id: "b", text: "" }
        ],
        correct_answer: "a"
      }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleAddOption = (questionIndex) => {
    const newQuestions = [...questions];
    const optionCount = newQuestions[questionIndex].options.length;
    const nextOptionId = String.fromCharCode(97 + optionCount); // a, b, c, d...
    newQuestions[questionIndex].options.push({
      option_id: nextOptionId,
      text: ""
    });
    setQuestions(newQuestions);
  };

  const handleRemoveOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex][field] = value;
    setQuestions(newQuestions);
  };

  const handleCreateQuiz = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/quizzes`, {
        title: quizTitle,
        description: quizDescription,
        questions: questions,
        created_by: "current_user"
      });
      
      // Reset form
      setQuizTitle("");
      setQuizDescription("");
      setQuestions([{
        question_id: "q1",
        question_text: "",
        options: [
          { option_id: "a", text: "" },
          { option_id: "b", text: "" }
        ],
        correct_answer: "a"
      }]);
      
      // Reload quizzes
      await loadQuizzes();
      
      // Auto-select the new quiz
      setSelectedQuiz(response.data);
      
      alert("Quiz created successfully!");
    } catch (error) {
      console.error("Error creating quiz:", error);
      alert("Error creating quiz. Please check the console.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckConsistency = async (quizId) => {
    setLoading(true);
    setConsistencyResult(null);
    try {
      const response = await axios.post(`${API}/quizzes/${quizId}/check-consistency`);
      setConsistencyResult(response.data);
    } catch (error) {
      console.error("Error checking consistency:", error);
      alert("Error checking consistency. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    
    try {
      await axios.delete(`${API}/quizzes/${quizId}`);
      await loadQuizzes();
      if (selectedQuiz?.id === quizId) {
        setSelectedQuiz(null);
        setConsistencyResult(null);
      }
      alert("Quiz deleted successfully!");
    } catch (error) {
      console.error("Error deleting quiz:", error);
      alert("Error deleting quiz.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                data-testid="back-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">
                  Quiz Management
                </h1>
                <p className="text-sm text-gray-600">Feature 1: Consistency Check</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="create" data-testid="create-tab">Create Quiz</TabsTrigger>
            <TabsTrigger value="manage" data-testid="manage-tab">Manage Quizzes</TabsTrigger>
          </TabsList>

          {/* Create Quiz Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card data-testid="create-quiz-card">
              <CardHeader>
                <CardTitle>Create New Quiz</CardTitle>
                <CardDescription>
                  Create a quiz with questions and options. The system will validate consistency automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quiz Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quiz Title *
                    </label>
                    <Input
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="Enter quiz title"
                      data-testid="quiz-title-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Textarea
                      value={quizDescription}
                      onChange={(e) => setQuizDescription(e.target.value)}
                      placeholder="Enter quiz description"
                      rows={3}
                      data-testid="quiz-description-input"
                    />
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                    <Button
                      onClick={handleAddQuestion}
                      variant="outline"
                      size="sm"
                      data-testid="add-question-button"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>

                  {questions.map((question, qIndex) => (
                    <Card key={qIndex} className="border-2" data-testid={`question-card-${qIndex}`}>
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Question ID
                                </label>
                                <Input
                                  value={question.question_id}
                                  onChange={(e) => handleQuestionChange(qIndex, "question_id", e.target.value)}
                                  placeholder="e.g., q1"
                                  data-testid={`question-id-${qIndex}`}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Correct Answer
                                </label>
                                <Input
                                  value={question.correct_answer}
                                  onChange={(e) => handleQuestionChange(qIndex, "correct_answer", e.target.value)}
                                  placeholder="e.g., a"
                                  data-testid={`correct-answer-${qIndex}`}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Question Text *
                              </label>
                              <Textarea
                                value={question.question_text}
                                onChange={(e) => handleQuestionChange(qIndex, "question_text", e.target.value)}
                                placeholder="Enter your question"
                                rows={2}
                                data-testid={`question-text-${qIndex}`}
                              />
                            </div>

                            {/* Options */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Options (min 2)
                                </label>
                                <Button
                                  onClick={() => handleAddOption(qIndex)}
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`add-option-${qIndex}`}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Option
                                </Button>
                              </div>
                              
                              <div className="space-y-2">
                                {question.options.map((option, oIndex) => (
                                  <div key={oIndex} className="flex items-center space-x-2">
                                    <Input
                                      value={option.option_id}
                                      onChange={(e) => handleOptionChange(qIndex, oIndex, "option_id", e.target.value)}
                                      placeholder="ID"
                                      className="w-20"
                                      data-testid={`option-id-${qIndex}-${oIndex}`}
                                    />
                                    <Input
                                      value={option.text}
                                      onChange={(e) => handleOptionChange(qIndex, oIndex, "text", e.target.value)}
                                      placeholder="Option text"
                                      className="flex-1"
                                      data-testid={`option-text-${qIndex}-${oIndex}`}
                                    />
                                    {question.options.length > 2 && (
                                      <Button
                                        onClick={() => handleRemoveOption(qIndex, oIndex)}
                                        variant="ghost"
                                        size="sm"
                                        data-testid={`remove-option-${qIndex}-${oIndex}`}
                                      >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {questions.length > 1 && (
                            <Button
                              onClick={() => handleRemoveQuestion(qIndex)}
                              variant="ghost"
                              size="sm"
                              className="ml-2"
                              data-testid={`remove-question-${qIndex}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Create Button */}
                <Button
                  onClick={handleCreateQuiz}
                  disabled={loading || !quizTitle}
                  className="w-full"
                  data-testid="create-quiz-button"
                >
                  {loading ? "Creating..." : "Create Quiz"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Quizzes Tab */}
          <TabsContent value="manage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quiz List */}
              <Card data-testid="quiz-list-card">
                <CardHeader>
                  <CardTitle>All Quizzes ({quizzes.length})</CardTitle>
                  <CardDescription>Select a quiz to check consistency</CardDescription>
                </CardHeader>
                <CardContent>
                  {quizzes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No quizzes created yet.</p>
                      <p className="text-sm">Create your first quiz in the Create tab.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {quizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedQuiz?.id === quiz.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => {
                            setSelectedQuiz(quiz);
                            setConsistencyResult(null);
                          }}
                          data-testid={`quiz-item-${quiz.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{quiz.title}</h4>
                              {quiz.description && (
                                <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>{quiz.questions.length} questions</span>
                                <span>•</span>
                                <span>{quiz.status}</span>
                              </div>
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuiz(quiz.id);
                              }}
                              variant="ghost"
                              size="sm"
                              data-testid={`delete-quiz-${quiz.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Consistency Check Panel */}
              <Card data-testid="consistency-check-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Consistency Check
                  </CardTitle>
                  <CardDescription>Validate quiz structure and content</CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedQuiz ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>Select a quiz to check consistency</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Selected Quiz Info */}
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h4 className="font-semibold text-gray-900">{selectedQuiz.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedQuiz.questions.length} questions
                        </p>
                      </div>

                      {/* Check Button */}
                      <Button
                        onClick={() => handleCheckConsistency(selectedQuiz.id)}
                        disabled={loading}
                        className="w-full"
                        data-testid="check-consistency-button"
                      >
                        {loading ? "Checking..." : "Run Consistency Check"}
                      </Button>

                      {/* Results */}
                      {consistencyResult && (
                        <div className="space-y-4" data-testid="consistency-results">
                          {/* Status */}
                          <Alert
                            variant={consistencyResult.is_valid ? "default" : "destructive"}
                            className={consistencyResult.is_valid ? "bg-green-50 border-green-200" : ""}
                          >
                            {consistencyResult.is_valid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                            <AlertTitle>
                              {consistencyResult.is_valid ? "Quiz is Valid ✓" : "Validation Failed"}
                            </AlertTitle>
                            <AlertDescription>
                              {consistencyResult.is_valid
                                ? "All consistency checks passed successfully."
                                : `Found ${consistencyResult.errors.length} error(s) that need attention.`}
                            </AlertDescription>
                          </Alert>

                          {/* Errors */}
                          {consistencyResult.errors.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="font-semibold text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Errors ({consistencyResult.errors.length})
                              </h5>
                              <div className="space-y-2">
                                {consistencyResult.errors.map((error, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-red-50 border border-red-200 rounded text-sm"
                                    data-testid={`error-${idx}`}
                                  >
                                    <div className="flex items-start">
                                      <Badge variant="destructive" className="mr-2 text-xs">
                                        {error.type}
                                      </Badge>
                                      <p className="text-red-800 flex-1">{error.message}</p>
                                    </div>
                                    {error.details && (
                                      <pre className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(error.details, null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Warnings */}
                          {consistencyResult.warnings.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="font-semibold text-yellow-600 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Warnings ({consistencyResult.warnings.length})
                              </h5>
                              <div className="space-y-2">
                                {consistencyResult.warnings.map((warning, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm"
                                  >
                                    <p className="text-yellow-800">{warning.message}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Timestamp */}
                          <p className="text-xs text-gray-500">
                            Checked at: {new Date(consistencyResult.checked_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default QuizManagement;
