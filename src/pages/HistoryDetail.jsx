import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Award,
  ThumbsUp,
  AlertCircle,
  BookOpen,
  Map,
  Code2,
  Calendar,
  CheckCircle2,
  FileText
} from 'lucide-react';

const HistoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { apiUrl } = useAuth();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Accordion active state
  const [expandedIndex, setExpandedIndex] = useState(0);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(`${apiUrl}/interviews/${id}`);
        setInterview(res.data.interview);
        setError('');
      } catch (err) {
        setError('Could not retrieve interview feedback logs.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, apiUrl]);

  const toggleAccordion = (idx) => {
    setExpandedIndex(expandedIndex === idx ? -1 : idx);
  };

  const getScoreRating = (score) => {
    if (score >= 80) return { label: 'Distinguished', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 60) return { label: 'Proficient', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Needs Practice', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
  };

  const getQuestionScoreColor = (score) => {
    if (score >= 8) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (score >= 6) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-pulse">
        <div className="h-6 bg-slate-300 dark:bg-slate-800 rounded w-1/4"></div>
        <div className="h-48 bg-slate-300 dark:bg-slate-800 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-300 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-64 bg-slate-300 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold dark:text-white text-slate-900 mb-2">Logs Unavailable</h2>
        <p className="dark:text-slate-400 text-slate-600 mb-6">{error || 'Session details not found.'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const overallScore = interview.overallFeedback?.score || 0;
  const rating = getScoreRating(overallScore);

  // SVG parameters for circle gauge
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="min-h-[calc(100vh-4rem)] dark:bg-darkBg bg-lightBg py-8 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Hero Score Banner */}
        <div className="p-6 md:p-8 rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 glow-indigo">
          <div className="space-y-3 text-center md:text-left relative z-10">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-200 dark:text-slate-300 text-slate-700 font-mono">
              COMPLETED SESSION REPORT
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold dark:text-white text-slate-900 mt-2">
              {interview.technology} Interview Evaluation
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-xs dark:text-slate-400 text-slate-500 font-semibold">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(interview.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span>•</span>
              <span className="uppercase tracking-wider">Difficulty: <span className="text-indigo-400">{interview.difficulty}</span></span>
            </div>
          </div>

          {/* SVG Circular Gauge */}
          <div className="flex flex-col items-center shrink-0 relative z-10">
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="stroke-indigo-500 transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold dark:text-white text-slate-800">{overallScore}%</span>
              </div>
            </div>
            <span className={`mt-3 text-xs font-bold px-3 py-1 rounded-full border ${rating.color}`}>
              {rating.label}
            </span>
          </div>
        </div>

        {/* Strengths and Weaknesses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="p-6 rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder relative overflow-hidden group">
            <h3 className="text-base font-bold dark:text-white text-slate-800 flex items-center gap-2 mb-4">
              <ThumbsUp className="w-5 h-5 text-emerald-500" />
              Demonstrated Strengths
            </h3>
            <ul className="space-y-3">
              {interview.overallFeedback?.strengths?.map((str, idx) => (
                <li key={idx} className="flex gap-2 text-sm dark:text-slate-300 text-slate-600 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{str}</span>
                </li>
              )) || <li className="text-sm text-slate-500 italic">No specific strengths recorded.</li>}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="p-6 rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder relative overflow-hidden group">
            <h3 className="text-base font-bold dark:text-white text-slate-800 flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Identified Gaps
            </h3>
            <ul className="space-y-3">
              {interview.overallFeedback?.weakAreas?.map((weak, idx) => (
                <li key={idx} className="flex gap-2 text-sm dark:text-slate-300 text-slate-600 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{weak}</span>
                </li>
              )) || <li className="text-sm text-slate-500 italic">No critical vulnerabilities identified.</li>}
            </ul>
          </div>
        </div>

        {/* Syllabus / Study topics & Learning Path */}
        <div className="p-6 md:p-8 rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder glow-indigo space-y-6">
          <div className="border-b dark:border-darkBorder border-slate-100 pb-4">
            <h3 className="text-lg font-bold dark:text-white text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Customized Learning Plan
            </h3>
            <p className="text-xs dark:text-slate-400 text-slate-500 mt-1">
              AI-generated roadmap based on your response errors and strength indexes.
            </p>
          </div>

          {/* study list */}
          <div>
            <h4 className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-3">
              Core Study Concepts
            </h4>
            <div className="flex flex-wrap gap-2">
              {interview.overallFeedback?.studyTopics?.map((topic, idx) => (
                <span
                  key={idx}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg dark:bg-slate-850 dark:border-darkBorder dark:text-indigo-400 bg-indigo-50 border border-indigo-100 text-indigo-700"
                >
                  {topic}
                </span>
              )) || <span className="text-xs text-slate-500 italic">No study topics suggested.</span>}
            </div>
          </div>

          {/* Timeline steps */}
          <div>
            <h4 className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Map className="w-4 h-4" />
              Roadmap Timeline
            </h4>
            <div className="relative pl-6 border-l dark:border-slate-800 border-slate-200 space-y-6">
              {interview.overallFeedback?.learningPath?.map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Bullet */}
                  <div className="absolute -left-[30px] top-0.5 w-4 h-4 rounded-full bg-indigo-500 border-4 dark:border-darkCard border-white flex items-center justify-center shadow-sm"></div>
                  
                  <div>
                    <h5 className="text-sm font-bold dark:text-white text-slate-800">{item.step}</h5>
                    <p className="mt-1 text-xs dark:text-slate-400 text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              )) || <p className="text-xs text-slate-500 italic">No roadmap generated.</p>}
            </div>
          </div>
        </div>

        {/* Detailed Question Review Accordion */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold dark:text-white text-slate-900 flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Detailed Question breakdown
          </h3>

          <div className="space-y-3">
            {interview.questions.map((question, idx) => {
              const isExpanded = expandedIndex === idx;
              const qScore = question.feedback?.score || 0;
              const qColor = getQuestionScoreColor(qScore);

              return (
                <div
                  key={question._id}
                  className="rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder overflow-hidden transition-all duration-300"
                >
                  {/* Trigger */}
                  <button
                    onClick={() => toggleAccordion(idx)}
                    className="w-full flex items-center justify-between p-5 text-left transition-colors dark:hover:bg-slate-800/20 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold dark:text-slate-500 text-slate-400">
                        0{idx + 1}
                      </span>
                      <p className="text-sm font-bold dark:text-white text-slate-800 line-clamp-1 max-w-[20rem] sm:max-w-lg">
                        {question.questionText}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border font-mono ${qColor}`}>
                        {qScore}/10
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {/* Panel Content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t dark:border-darkBorder border-slate-100 space-y-4 text-sm animate-fadeIn">
                      <div>
                        <span className="block text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-1">
                          Question Prompt
                        </span>
                        <p className="dark:text-slate-200 text-slate-800 leading-relaxed bg-slate-50 dark:bg-darkBg/30 p-3 rounded-lg border dark:border-darkBorder/50 border-slate-100">
                          {question.questionText}
                        </p>
                      </div>

                      <div>
                        <span className="block text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-1">
                          Your Answer
                        </span>
                        <p className="dark:text-slate-300 text-slate-700 leading-relaxed font-mono text-xs whitespace-pre-wrap bg-slate-50 dark:bg-darkBg/50 p-4 rounded-lg border dark:border-darkBorder/50 border-slate-100">
                          {question.answerText || "(No response recorded)"}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border dark:border-darkBorder dark:bg-darkBg/20 bg-slate-50 border-slate-100 space-y-1">
                          <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Technical Strengths
                          </span>
                          <p className="text-xs dark:text-slate-300 text-slate-600 leading-relaxed pt-1">
                            {question.feedback?.strengths || 'No specific highlights listed.'}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl border dark:border-darkBorder dark:bg-darkBg/20 bg-slate-50 border-slate-100 space-y-1">
                          <span className="text-xs font-semibold text-rose-500 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Weak Areas
                          </span>
                          <p className="text-xs dark:text-slate-300 text-slate-600 leading-relaxed pt-1">
                            {question.feedback?.weakAreas || 'No significant errors noted.'}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-indigo-500/10 dark:bg-indigo-500/5 bg-indigo-50/30 space-y-1">
                        <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5" />
                          Recommended Solution & Core Theory
                        </span>
                        <p className="text-xs dark:text-slate-300 text-slate-600 leading-relaxed pt-1 whitespace-pre-wrap font-sans">
                          {question.feedback?.improvements || 'Review documentation files.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HistoryDetail;
