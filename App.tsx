
import React, { useState, useRef } from 'react';
import { AppState } from './types';
import { evaluateArticle } from './services/geminiService';
import { Scorecard } from './components/Scorecard';

declare const mammoth: any;
declare const pdfjsLib: any;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    draft: '',
    evaluation: null,
    isLoading: false,
    error: null,
  });
  const [googleDocLink, setGoogleDocLink] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const handleFileUpload = async (file: File) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      let text = '';
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await extractTextFromDocx(file);
      } else if (file.type === 'application/pdf') {
        text = await extractTextFromPdf(file);
      } else if (file.type === 'text/plain') {
        text = await file.text();
      } else {
        throw new Error('Unsupported file type. Please upload a .docx, .pdf, or .txt file.');
      }
      
      setState(prev => ({ ...prev, draft: text, isLoading: false }));
      setGoogleDocLink(''); // Clear link if file is uploaded
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isLoading: false }));
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleEvaluate = async () => {
    const submission = googleDocLink.trim() ? `GOOGLE DOC LINK: ${googleDocLink}\n\nCONTENT OR CONTEXT: ${state.draft}` : state.draft;
    
    if (!submission.trim()) return;

    setState(prev => ({ ...prev, isLoading: true, error: null, evaluation: null }));
    try {
      const result = await evaluateArticle(submission);
      setState(prev => ({ ...prev, evaluation: result, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isLoading: false }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-blue-100 text-blue-600">
          <i className="fas fa-stethoscope text-3xl"></i>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Student Pulse Senior Editor</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Refine your occupational therapy insights for a peer-to-peer audience. 
          Mentoring students to craft engaging, accessible content for the AOTA community.
        </p>
        <div className="mt-6 inline-block bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-amber-800 text-sm font-medium">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          "Please note: Articles are not guaranteed to be published based on a pitch or a first draft."
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <section className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <i className="fas fa-pen-nib mr-2 text-blue-500"></i>
                Draft Submission
              </h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowLinkInput(!showLinkInput)}
                  className={`text-xs px-3 py-1 rounded transition-colors flex items-center ${showLinkInput ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <i className="fas fa-link mr-1"></i> Google Doc
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded transition-colors flex items-center"
                >
                  <i className="fas fa-file-upload mr-1"></i> Upload
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".docx,.pdf,.txt"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </div>
            </div>

            {showLinkInput && (
              <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Google Docs Link</label>
                <div className="relative">
                  <input 
                    type="url"
                    placeholder="https://docs.google.com/document/d/..."
                    value={googleDocLink}
                    onChange={(e) => setGoogleDocLink(e.target.value)}
                    className="w-full p-3 pl-10 bg-blue-50 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <i className="fab fa-google-drive absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"></i>
                </div>
                <p className="mt-1 text-[10px] text-gray-400 ml-1">Note: Ensure "Anyone with the link" has access.</p>
              </div>
            )}

            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`relative transition-all duration-200 ${isDragging ? 'scale-[1.01]' : ''}`}
            >
              {isDragging && (
                <div className="absolute inset-0 z-10 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center pointer-events-none">
                  <div className="bg-white px-4 py-2 rounded-full shadow-lg text-blue-600 font-bold animate-bounce">
                    Drop to extract text
                  </div>
                </div>
              )}
              <textarea
                className="w-full h-80 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all outline-none text-gray-700 leading-relaxed"
                placeholder={googleDocLink ? "Add any specific instructions or notes for the editor here..." : "Paste your draft or drag & drop a .docx/.pdf here..."}
                value={state.draft}
                onChange={(e) => setState(prev => ({ ...prev, draft: e.target.value }))}
              />
            </div>

            <button
              onClick={handleEvaluate}
              disabled={state.isLoading || (!state.draft.trim() && !googleDocLink.trim())}
              className={`mt-4 w-full py-4 rounded-lg font-bold text-white transition-all transform active:scale-95 shadow-md flex items-center justify-center ${
                state.isLoading || (!state.draft.trim() && !googleDocLink.trim())
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
              }`}
            >
              {state.isLoading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin mr-2"></i>
                  Mentoring in progress...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Evaluate & Mentor
                </>
              )}
            </button>
            {state.error && (
              <p className="mt-3 text-red-500 text-sm text-center font-medium">
                <i className="fas fa-exclamation-circle mr-1"></i> {state.error}
              </p>
            )}
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h4 className="font-bold text-blue-900 mb-2">Editor's Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start">
                <i className="fas fa-info-circle mt-1 mr-2 text-blue-500"></i>
                Submit via <strong>Google Link</strong>, <strong>Word</strong>, or <strong>PDF</strong>!
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle mt-1 mr-2 text-blue-500"></i>
                Check for person-first language (e.g., "person with a disability").
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle mt-1 mr-2 text-blue-500"></i>
                Keep it conversational—write like you're talking to a peer.
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-6">
          {!state.evaluation && !state.isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400">
              <i className="fas fa-clipboard-list text-6xl mb-4 opacity-20"></i>
              <p className="text-lg">Submit your work to see your Readiness Scorecard.</p>
            </div>
          )}

          {state.isLoading && (
            <div className="space-y-6 animate-pulse">
              <div className="bg-gray-200 h-64 rounded-xl"></div>
              <div className="bg-gray-200 h-40 rounded-xl"></div>
              <div className="bg-gray-200 h-96 rounded-xl"></div>
            </div>
          )}

          {state.evaluation && (
            <>
              <Scorecard scorecard={state.evaluation.scorecard} rating={state.evaluation.readinessRating} />
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-amber-500 px-6 py-4"><h3 className="text-white font-bold text-lg">Section 2: Editor's Notes</h3></div>
                <div className="p-6">
                  <ul className="space-y-4">
                    {state.evaluation.editorNotes.map((note, idx) => (
                      <li key={idx} className="flex items-start group">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm mr-3">{idx + 1}</span>
                        <p className="text-gray-700 leading-relaxed pt-1">{note}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
                  <h3 className="text-white font-bold text-lg">Section 3: The Polished Draft</h3>
                  <button onClick={() => { navigator.clipboard.writeText(state.evaluation?.polishedDraft || ''); alert('Copied!'); }} className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded transition-colors uppercase font-bold">Copy</button>
                </div>
                <div className="p-6 prose prose-blue max-w-none">
                  <div className="p-4 bg-gray-50 border-l-4 border-indigo-500 text-sm text-gray-500 italic mb-6">Note: Edits for tone, flow, and formatting are <strong>bolded</strong>.</div>
                  <div className="text-gray-800 whitespace-pre-wrap leading-relaxed font-serif">
                    {state.evaluation.polishedDraft.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-blue-700 bg-blue-50 px-1 rounded">{part}</strong> : part)}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default App;
