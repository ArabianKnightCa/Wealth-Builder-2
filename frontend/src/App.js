import { useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import QuizManagement from "./pages/QuizManagement";
import HomePage from "./pages/HomePage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quizzes" element={<QuizManagement />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;