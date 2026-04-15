import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { FileText, Plus, LogOut, UploadCloud, Users, Clock } from 'lucide-react';

export default function Dashboard({ user, onLogout }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const { data } = await api.get('/documents');
      setDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    try {
      const { data } = await api.post('/documents', {});
      navigate(`/editor/${data._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md') && !file.name.endsWith('.docx')) {
       alert("Only .txt, .md and .docx files are supported for import.");
       return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate(`/editor/${data._id}`);
    } catch (err) {
      console.error("Upload error", err);
    }
  };

  const ownedDocs = docs.filter(d => d.owner === user.id || d.owner?._id === user.id || d.owner === user._id); // Handling various return formats
  const sharedDocs = docs.filter(d => d.sharedWith.some(shared => shared === user.id || shared?._id === user.id || shared === user._id));

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 transition-colors duration-500">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-16">
          <div className="mb-6 md:mb-0">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">My Workspace</h1>
            <p className="text-slate-500 flex items-center gap-2">
              Viewing assets for <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-bold text-sm border border-blue-100">{user.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleCreateNew}
              className="group flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-100"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              New Document
            </button>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 px-5 py-3 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-bold rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* Owned Docs */}
            <section>
              <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Personal Documents
                </h2>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">{ownedDocs.length} Docs</span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white animate-pulse rounded-xl border border-slate-100"></div>)}
                </div>
              ) : ownedDocs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ownedDocs.map(doc => (
                    <div 
                      key={doc._id} 
                      onClick={() => navigate(`/editor/${doc._id}`)}
                      className="group cursor-pointer p-6 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-[0_10px_40px_rgba(37,99,235,0.05)] transition-all duration-300"
                    >
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate mb-4">{doc.title}</h3>
                      <div className="flex items-center justify-between text-xs text-slate-400 mt-auto border-t border-slate-50 pt-4">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> {new Date(doc.updatedAt).toLocaleDateString()}</span>
                        {doc.sharedWith?.length > 0 && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 rounded border border-green-100">
                            <Users className="w-3 h-3"/> Shared
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-16 bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
                  <div className="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-slate-900 font-bold mb-1">No documents found</h3>
                  <p className="text-slate-500 text-sm">Get started by creating your first document.</p>
                </div>
              )}
            </section>

             {/* Shared Docs */}
             <section>
              <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Users className="w-4 h-4" /> Shared Libraries
                </h2>
              </div>
              
              {sharedDocs.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {sharedDocs.map(doc => (
                    <div 
                      key={doc._id} 
                      onClick={() => navigate(`/editor/${doc._id}`)}
                      className="group cursor-pointer p-6 bg-white border border-slate-200 rounded-xl flex justify-between items-center hover:border-blue-400 hover:shadow-xl transition-all"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{doc.title}</h3>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Owned by {doc.owner?.email || 'Unknown'}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-blue-100 transition-colors">
                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors"/>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-slate-100 rounded-xl text-slate-500 text-sm border border-slate-200 font-medium text-center">
                  Documents shared with you will appear in this section.
                </div>
              )}
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-200 transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
              <div className="w-20 h-20 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 mb-6 group-hover:scale-105 group-hover:border-blue-200 transition-all shadow-md">
                <UploadCloud className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Import Workspace</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Seamlessly upload <span className="text-blue-600 font-bold">.txt</span>, <span className="text-blue-600 font-bold">.md</span> or <span className="text-blue-600 font-bold">.docx</span> files.
              </p>
              <div className="mt-8 py-2 px-4 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                CLICK TO BROWSE
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".txt,.md,.docx" 
                className="hidden" 
              />
            </div>

            {/* Platform Stats or Info */}
            <div className="p-8 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <h4 className="text-lg font-bold mb-2">Secure Workspace</h4>
                <p className="text-blue-50 text-sm leading-relaxed opacity-90">
                  Your documents are encrypted and protected. Collaboration is seamless and instantaneous.
                </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
