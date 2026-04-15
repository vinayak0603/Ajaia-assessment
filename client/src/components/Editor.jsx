import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { ArrowLeft, Share2, CheckCircle, Users, History, MessageSquare, Download, FileText, FileDown, X } from 'lucide-react';
import { io } from 'socket.io-client';
import TurndownService from 'turndown';

const SOCKET_URL = 'http://localhost:5000';
let socket;

export default function Editor({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New features state
  const [activeUsers, setActiveUsers] = useState([]);
  const [sidebarTab, setSidebarTab] = useState(null); // 'comments' | 'history' | null
  const [newComment, setNewComment] = useState('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUser, setShareUser] = useState('');

  // Auto-save ref
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    socket = io(SOCKET_URL);
    if (id && user) {
      socket.emit('join-document', { documentId: id, username: user.email });
      socket.on('active-users', (users) => setActiveUsers(users));
    }
    return () => {
      if (id && user) socket.emit('leave-document', { documentId: id, username: user.email });
      socket.disconnect();
    };
  }, [id, user]);

  useEffect(() => {
    if (id) {
      fetchDoc();
    }
  }, [id]);

  const fetchDoc = async () => {
    try {
      const { data } = await api.get(`/documents/${id}`);
      setDoc(data);
      setTitle(data.title);
      setContent(data.content);
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const saveDoc = async (newTitle = title, newContent = content) => {
    try {
      setSaving(true);
      await api.put(`/documents/${id}`, { title: newTitle, content: newContent });
      // Optionally re-fetch after 2 secs to update version history list silently
      // In a more complex app, the server returns the updated doc inline.
      setTimeout(() => setSaving(false), 500);

      const { data } = await api.get(`/documents/${id}`);
      setDoc(data);
    } catch (err) {
      console.error("Save error", err);
      setSaving(false);
    }
  };

  const handleContentChange = (val) => {
    setContent(val);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveDoc(title, val);
    }, 1500); // 1.5s debounce
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveDoc(val, content);
    }, 1500);
  };

  const handleShare = async () => {
    if (!shareUser.trim()) return;
    try {
      await api.put(`/documents/${id}/share`, { email: shareUser.trim() });
      setIsShareModalOpen(false);
      setShareUser('');
      alert("Document shared successfully!");
    } catch (err) {
      alert("Failed to share document. " + (err.response?.data?.error || err.message));
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const { data } = await api.post(`/documents/${id}/comments`, { text: newComment });
      setDoc(data);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportMarkdown = () => {
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(content);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'document'}.md`;
    a.click();
    setIsExportMenuOpen(false);
  };

  const handleExportPDF = () => {
    setIsExportMenuOpen(false);
    window.print();
  };

  const handleRestoreVersion = (versionContent) => {
    if (window.confirm("Are you sure you want to restore this version? This will become your active document.")) {
      setContent(versionContent);
      saveDoc(title, versionContent);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Initializing Terminal...</p>
    </div>
  );

  const isOwner = doc?.owner === user.id || doc?.owner?._id === user.id || doc?.owner === user._id;

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  return (
    <div className="min-h-screen bg-white flex flex-col print:bg-white text-slate-900 font-sans">
      {/* Top Bar - hidden in print mode */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between sticky top-0 z-10 print:hidden gap-6 shadow-sm">
        <div className="flex items-center gap-6 flex-1 w-full md:w-auto">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-slate-900 transition-colors p-2 -ml-2 rounded-lg hover:bg-slate-50"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="text-2xl font-bold text-slate-900 bg-transparent border-none outline-none flex-1 max-w-sm px-2 py-1 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-lg transition-all tracking-tight"
            placeholder="Document Title"
          />
        </div>

        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Active Users */}
          <div className="flex items-center -space-x-3 mr-2">
            {activeUsers.map(u => (
              <div key={u} className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm" title={`${u} is actively reading`}>
                <span className="text-xs font-black text-blue-700">{u.slice(0, 2).toUpperCase()}</span>
              </div>
            ))}
          </div>

          <div className="hidden md:flex items-center justify-center min-w-[90px]">
            {saving ? (
              <span className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-400" style={{ borderRightColor: 'transparent' }}></span> Syncing
              </span>
            ) : (
              <span className="flex items-center gap-2 text-xs text-green-600 font-bold uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Local Saved
              </span>
            )}
          </div>

          {/* Tools Menu */}
          <div className="flex items-center gap-3 border-l border-slate-100 pl-6 h-10">
            <button
              onClick={() => setSidebarTab(sidebarTab === 'history' ? null : 'history')}
              className={`p-2.5 rounded-lg transition-all ${sidebarTab === 'history' ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
              title="Version History"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSidebarTab(sidebarTab === 'comments' ? null : 'comments')}
              className={`p-2.5 rounded-lg transition-all relative ${sidebarTab === 'comments' ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
              title="Comments"
            >
              <MessageSquare className="w-5 h-5" />
              {doc?.comments?.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>

            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                title="Export"
              >
                <Download className="w-5 h-5" />
              </button>
              {isExportMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  <button onClick={handleExportMarkdown} className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-3 transition-colors">
                    <FileText className="w-4 h-4" /> Export as Markdown
                  </button>
                  <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-3 transition-colors">
                    <FileDown className="w-4 h-4" /> Download PDF
                  </button>
                </div>
              )}
            </div>

            {isOwner && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2 ml-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-100 text-sm"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Editor Main */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex gap-8 overflow-hidden print:p-0 print:max-w-none">
        <main className={`flex-1 transition-all ${sidebarTab ? 'hidden md:flex' : 'flex'} flex-col bg-white shadow-xl rounded-2xl overflow-hidden print:border-none print:shadow-none border border-slate-200`}>
          {/* Active user notice for mobile print */}
          <div className="hidden print:block mb-8 border-b pb-4 p-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{title}</h1>
            <p className="text-slate-500 text-sm">Ajaia Private Document • {new Date().toLocaleDateString()}</p>
          </div>

          <ReactQuill
            theme="snow"
            value={content}
            onChange={handleContentChange}
            modules={modules}
            className="flex-1 flex flex-col h-full overflow-y-auto ql-snow-container"
          />
        </main>

        {/* Sidebar */}
        {sidebarTab && (
          <aside className="w-full md:w-80 lg:w-96 bg-white border border-slate-200 rounded-2xl shadow-lg flex flex-col overflow-hidden animate-in slide-in-from-right-4 print:hidden shrink-0">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                {sidebarTab === 'comments' ? <><MessageSquare className="w-4 h-4" /> Comments Feed</> : <><History className="w-4 h-4" /> Historical Log</>}
              </h3>
              <button onClick={() => setSidebarTab(null)} className="text-slate-400 hover:text-slate-900 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {sidebarTab === 'comments' ? (
                <>
                  <div className="space-y-6">
                    {doc?.comments?.map((c, i) => (
                      <div key={i} className="bg-slate-50 p-5 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">{c.user?.email?.[0].toUpperCase()}</div>
                            <span className="font-bold text-xs text-slate-800">{c.user?.email || 'User'}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{c.text}</p>
                      </div>
                    ))}
                    {doc?.comments?.length === 0 && (
                      <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Zero Comments</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-6 relative pl-5 border-l-2 border-slate-100 ml-2">
                  {doc?.versions?.map((v, i) => (
                    <div key={i} className="relative z-10">
                      <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 group hover:border-blue-200 transform hover:-translate-y-1 transition-all">
                        <p className="font-bold text-xs text-slate-400 mb-1">{new Date(v.savedAt).toLocaleDateString()}</p>
                        <p className="font-black text-sm text-slate-800 tracking-tight">{new Date(v.savedAt).toLocaleTimeString()}</p>
                        <button onClick={() => handleRestoreVersion(v.content)} className="mt-4 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-all font-sans">
                          Restore Revision
                        </button>
                      </div>
                    </div>
                  ))}
                  {doc?.versions?.length === 0 && (
                    <div className="text-center py-12 -ml-5">
                      <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No Revisions</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {sidebarTab === 'comments' && (
              <div className="p-5 border-t border-slate-100 bg-white pb-8 md:pb-6">
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 text-sm bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-500 transition-all"
                    placeholder="Type a comment..."
                  />
                  <button type="submit" className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-100 font-sans">Post</button>
                </form>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-2xl scale-in-center border border-slate-100">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
              <Share2 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Collaborate</h3>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed">Expand your workspace. Share this document with team members via email.</p>

            <div className="relative mb-8">
              <input
                type="email"
                value={shareUser}
                onChange={(e) => setShareUser(e.target.value)}
                placeholder="colleague@ajaia.com"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-bold"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="flex-1 py-4 px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                className="flex-1 py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-xl shadow-blue-100 transition-all active:scale-95"
              >
                Confirm Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles for overriding quill to fill height natively */}
      <style>{`
        .ql-snow-container {
            border: none;
        }
        .ql-snow-container .quill {
            flex: 1;
            display: flex;
            flex-direction: column;
            border: none;
        }
        .ql-snow-container .ql-container {
            flex: 1;
            height: auto;
            border: none !important;
            font-family: 'Outfit', sans-serif;
        }
        .ql-snow-container .ql-toolbar {
            border: none !important;
            border-bottom: 1px solid #f1f5f9 !important;
            padding: 1.25rem;
            background: #ffffff;
        }
        .ql-snow-container .ql-editor {
            padding: 4rem 4rem;
            font-size: 1.15rem;
            line-height: 1.8;
            color: #1e293b;
            min-height: 50vw;
        }
        /* Customizing toolbar buttons for minimal look */
        .ql-snow .ql-stroke {
           stroke: #64748b;
        }
        .ql-snow .ql-fill {
           fill: #64748b;
        }
        .ql-snow.ql-toolbar button:hover .ql-stroke, 
        .ql-snow.ql-toolbar button:hover .ql-fill {
           stroke: #3b82f6;
           fill: #3b82f6;
        }
        @media print {
            .ql-toolbar { display: none !important; }
            .ql-container { border: none !important; }
            .ql-editor { padding: 0 !important; color: black; font-size: 12pt; }
        }
      `}</style>
    </div>
  );
}
