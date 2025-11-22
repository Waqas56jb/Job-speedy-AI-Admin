import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/i18n";

const JobManagementPage = () => {
  const { language } = useLanguage();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiJob, setAiJob] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedJobForPublish, setSelectedJobForPublish] = useState(null);
  const [selectedPortal, setSelectedPortal] = useState("indeed");
  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    required_skills: "",
    location: "",
    job_type: "Full-time",
    category: "General",
    language: "English",
  });

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("https://admin-backend-wheat.vercel.app/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || data || []);
      }
    } catch (e) {
      console.error("Error loading jobs:", e);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setShowAddChoice(true); };
  const startManual = () => { setUseAI(false); setShowAddChoice(false); setEditingJob(null); setForm({ title:"", company:"", description:"", required_skills:"", location:"", job_type:"Full-time", category:"General", language:"English" }); setShowForm(true); };
  const startAI = () => { setShowAddChoice(false); setUseAI(true); setAiDescription(""); setAiJob(null); setAiLoading(false); setShowForm(true); setEditingJob(null); };
  const openEdit = (job) => { setEditingJob(job); setForm({
    title: job.title || "",
    company: job.company || "",
    description: job.description || "",
    required_skills: Array.isArray(job.required_skills) ? job.required_skills.join(', ') : (job.required_skills || ""),
    location: job.location || "",
    job_type: job.job_type || "Full-time",
    category: job.category || "General",
    language: job.language || "English",
  }); setShowForm(true); };

  const saveJob = async () => {
    const payload = { ...form };
    try {
      const res = await fetch(`https://admin-backend-wheat.vercel.app/api/jobs${editingJob ? '/' + editingJob.id : ''}`, {
        method: editingJob ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save job');
      setShowForm(false);
      await fetchJobs();
    } catch (e) {
      alert(e.message);
    }
  };

  const aiGenerate = async () => {
    if (!aiDescription.trim()) { alert(language === 'de' ? 'Bitte geben Sie eine kurze Beschreibung ein' : 'Please enter a short description'); return; }
    setAiLoading(true);
    try {
      const res = await fetch('https://admin-backend-wheat.vercel.app/api/jobs/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiDescription })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate job');
      setAiJob(data.jobAd || null);
    } catch (e) {
      alert(e.message);
    } finally { setAiLoading(false); }
  };

  const aiPost = async () => {
    if (!aiJob) return;
    try {
      const res = await fetch('https://admin-backend-wheat.vercel.app/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiJob)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to post job');
      setShowForm(false); setAiJob(null); setAiDescription("");
      await fetchJobs();
    } catch (e) { alert(e.message); }
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm(t(language, 'jobs.deleteConfirm'))) return;
    try {
      const res = await fetch(`https://admin-backend-wheat.vercel.app/api/jobs/${jobId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchJobs();
    } catch (e) { alert(e.message); }
  };

  const handleChange = (e) => { const { name, value } = e.target; setForm((f) => ({ ...f, [name]: value })); };

  const openPublishModal = (job) => {
    setSelectedJobForPublish(job);
    setShowPublishModal(true);
  };

  const handlePublish = async () => {
    if (!selectedJobForPublish || !selectedPortal) return;
    
    try {
      const res = await fetch(`https://admin-backend-wheat.vercel.app/api/jobs/${selectedJobForPublish.id}/xml-feed/${selectedPortal}`);
      if (!res.ok) {
        throw new Error('Failed to generate XML feed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job_${selectedJobForPublish.id}_${selectedPortal}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowPublishModal(false);
      setSelectedJobForPublish(null);
    } catch (e) {
      alert(language === 'de' ? 'XML-Feed-Download fehlgeschlagen: ' : 'Failed to download XML feed: ' + e.message);
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <h2 style={styles.mainHeader}>{t(language, 'jobs.title')}</h2>
          <button style={styles.primaryBtn} onClick={openCreate}>+ {t(language, 'jobs.createJob')}</button>
        </div>

        {/* Create choice modal */}
        {showAddChoice && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <h3 style={{ marginTop: 0 }}>{language === 'de' ? 'Wie möchten Sie eine Stelle hinzufügen?' : 'How would you like to add a job?'}</h3>
              <p style={{ color: '#666', marginTop: 4 }}>{language === 'de' ? 'Wählen Sie manuelle Eingabe oder lassen Sie die KI einen Entwurf für Sie erstellen.' : 'Choose manual entry or let AI draft it for you.'}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button style={styles.primaryBtn} onClick={startManual}>➕ {language === 'de' ? 'Manuell' : 'Manual'}</button>
                <button style={styles.aiBtn} onClick={startAI}>✨ {language === 'de' ? 'KI verwenden' : 'Use AI'}</button>
                <button style={styles.secondaryBtn} onClick={() => setShowAddChoice(false)}>{t(language, 'jobs.cancel')}</button>
              </div>
            </div>
          </div>
        )}

        {showForm && !useAI && (
          <div style={styles.formCard}>
            <div style={styles.formGrid} className="responsive-form-grid">
              <input name="title" value={form.title} onChange={handleChange} placeholder="Job Title *" style={styles.input}/>
              <input name="company" value={form.company} onChange={handleChange} placeholder="Company *" style={styles.input}/>
              <input name="location" value={form.location} onChange={handleChange} placeholder="Location" style={styles.input}/>
              <select name="job_type" value={form.job_type} onChange={handleChange} style={styles.input}>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Remote</option>
                <option>Contract</option>
                <option>Hybrid</option>
              </select>
              <input name="category" value={form.category} onChange={handleChange} placeholder="Category" style={styles.input}/>
              <input name="language" value={form.language} onChange={handleChange} placeholder="Language" style={styles.input}/>
            </div>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" style={styles.textarea} rows="4"/>
            <input name="required_skills" value={form.required_skills} onChange={handleChange} placeholder="Required skills (comma separated)" style={styles.input}/>
            <div style={styles.formActions}>
              <button style={styles.primaryBtn} onClick={saveJob}>{editingJob ? (language === 'de' ? 'Änderungen speichern' : 'Save Changes') : t(language, 'jobs.createJob')}</button>
              <button style={styles.secondaryBtn} onClick={() => setShowForm(false)}>{t(language, 'jobs.cancel')}</button>
            </div>
          </div>
        )}

        {showForm && useAI && (
          <div style={styles.formCard}>
            <h3 style={{ marginTop: 0 }}>✨ {t(language, 'aiTools.jobGenerator')}</h3>
            <p style={{ color: '#666' }}>{t(language, 'aiTools.jobGeneratorDesc')}</p>
            <textarea value={aiDescription} onChange={(e)=>setAiDescription(e.target.value)} placeholder="e.g., Need a senior React developer with 5+ years, TypeScript, API integration, remote OK" style={styles.textarea} rows="4"/>
            <div style={styles.formActions}>
              <button style={styles.primaryBtn} onClick={aiGenerate} disabled={aiLoading}>{aiLoading ? t(language, 'aiTools.generating') : t(language, 'aiTools.generateJobPost')}</button>
              <button style={styles.secondaryBtn} onClick={()=>{setShowForm(false); setAiJob(null);}}>{t(language, 'jobs.cancel')}</button>
            </div>
            {aiJob && (
              <div style={styles.previewCard}>
                <div style={styles.previewHeader}>
                  <div>
                    <div style={styles.jobTitle}>{aiJob.title}</div>
                    <div style={styles.jobMeta}>{aiJob.company || (language === 'de' ? 'Unternehmen' : 'Company')} • {aiJob.job_type || (language === 'de' ? 'Typ' : 'Type')} • {aiJob.location || (language === 'de' ? 'Standort' : 'Location')}</div>
                  </div>
                  <button style={styles.primaryBtn} onClick={aiPost}>📤 {language === 'de' ? 'Stelle veröffentlichen' : 'Post Job'}</button>
                </div>
                <div style={styles.previewBody}>
                  <div style={styles.previewSection}><strong>{language === 'de' ? 'Beschreibung' : 'Description'}</strong><p style={{marginTop:8}}>{aiJob.description}</p></div>
                  <div style={styles.previewSection}><strong>{language === 'de' ? 'Anforderungen' : 'Requirements'}</strong>
                    <div style={styles.chips}>
                      {(() => {
                        const raw = aiJob.requirements ?? aiJob.required_skills ?? [];
                        const list = Array.isArray(raw)
                          ? raw
                          : (typeof raw === 'string'
                              ? raw.split(',').map(s => s.trim()).filter(Boolean)
                              : []);
                        return list.map((r, i) => (
                          <span key={i} style={styles.chip}>{r}</span>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Job Table */}
        {loading ? (
          <div style={styles.loading}>{language === 'de' ? 'Stellen werden geladen...' : 'Loading jobs...'}</div>
        ) : (
        <div style={styles.tableContainer} className="job-table-container">
          <table style={styles.table} className="job-table">
            <thead>
              <tr style={styles.headerRowStrip}>
                <th style={{...styles.th, width:'30%'}}>{language === 'de' ? 'Titel' : 'Title'}</th>
                <th style={{...styles.th, width:'15%'}}>{language === 'de' ? 'Unternehmen' : 'Company'}</th>
                <th style={{...styles.th, width:'13%'}}>{language === 'de' ? 'Standort' : 'Location'}</th>
                <th style={{...styles.th, width:'11%'}}>{language === 'de' ? 'Typ' : 'Type'}</th>
                <th style={{...styles.th, width:'13%'}}>{language === 'de' ? 'Kategorie' : 'Category'}</th>
                <th style={{...styles.th, width:'18%', textAlign:'right'}}>{t(language, 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr><td colSpan="6" style={styles.noData}>{t(language, 'jobs.noJobs')}</td></tr>
              ) : jobs.map((job) => (
                <tr key={job.id} style={styles.row}>
                  <td style={{...styles.td, width:'30%'}}>
                    <div style={styles.cellTitle}>{job.title}</div>
                    <div style={styles.cellSub}>{job.description ? String(job.description).slice(0,96) + (String(job.description).length>96?'…':'') : '—'}</div>
                  </td>
                  <td style={{...styles.td, width:'15%'}}><span style={styles.badge}>{job.company}</span></td>
                  <td style={{...styles.td, width:'13%'}}>{job.location || '—'}</td>
                  <td style={{...styles.td, width:'11%'}}><span style={styles.pill}>{job.job_type || '—'}</span></td>
                  <td style={{...styles.td, width:'13%'}}>{job.category || '—'}</td>
                  <td style={{...styles.td, width:'18%'}}>
                    <div style={styles.actionsCell}>
                      <button style={styles.publishBtn} onClick={() => openPublishModal(job)}>{t(language, 'jobs.publish')}</button>
                      <button style={styles.actionBtn} onClick={() => openEdit(job)}>{t(language, 'jobs.edit')}</button>
                      <button style={styles.dangerBtn} onClick={() => deleteJob(job.id)}>{t(language, 'jobs.delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Publish Modal */}
        {showPublishModal && selectedJobForPublish && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <h3 style={{ marginTop: 0 }}>{t(language, 'jobs.publishModalTitle')}</h3>
              <p style={{ color: '#666', marginTop: 4, marginBottom: 16 }}>
                {language === 'de' ? 'Wählen Sie ein Job-Portal aus, um einen XML-Feed zu generieren für' : 'Select a job portal to generate an XML feed for'} <strong>{selectedJobForPublish.title}</strong>
              </p>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#2e236c' }}>
                  {t(language, 'jobs.selectPortal')}
                </label>
                <select 
                  value={selectedPortal} 
                  onChange={(e) => setSelectedPortal(e.target.value)}
                  style={styles.select}
                >
                  <option value="indeed">Indeed</option>
                  <option value="glassdoor">Glassdoor</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="generic">Generic XML Feed</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button style={styles.primaryBtn} onClick={handlePublish}>
                  📥 {t(language, 'jobs.downloadXml')}
                </button>
                <button style={styles.secondaryBtn} onClick={() => {
                  setShowPublishModal(false);
                  setSelectedJobForPublish(null);
                }}>
                  {t(language, 'jobs.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const styles = {
  container: { padding: "clamp(10px, 2vw, 20px) 0" },
  headerRow: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: "clamp(15px, 3vw, 20px)",
    flexWrap: "wrap",
    gap: "10px",
  },
  mainHeader: { 
    fontSize: "clamp(20px, 4vw, 28px)", 
    fontWeight: "bold", 
    margin: 0, 
    color: "#2e236c" 
  },
  primaryBtn: { 
    padding: "clamp(10px, 2vw, 12px) clamp(16px, 3vw, 20px)", 
    borderRadius: "8px", 
    border: "none", 
    backgroundColor: "#0477BF", 
    color: "white", 
    fontWeight: "600", 
    cursor: "pointer",
    fontSize: "clamp(12px, 2.5vw, 14px)",
    minHeight: "44px",
  },
  aiBtn: { 
    padding: "clamp(10px, 2vw, 12px) clamp(16px, 3vw, 20px)", 
    borderRadius: "8px", 
    border: "none", 
    backgroundColor: "#6a5acd", 
    color: "white", 
    fontWeight: "600", 
    cursor: "pointer",
    fontSize: "clamp(12px, 2.5vw, 14px)",
    minHeight: "44px",
  },
  secondaryBtn: { 
    padding: "clamp(10px, 2vw, 12px) clamp(16px, 3vw, 20px)", 
    borderRadius: "8px", 
    border: "1px solid #ddd", 
    backgroundColor: "white", 
    color: "#666", 
    fontWeight: "600", 
    cursor: "pointer",
    fontSize: "clamp(12px, 2.5vw, 14px)",
    minHeight: "44px",
  },
  formCard: { 
    background: "white", 
    borderRadius: "12px", 
    padding: "clamp(15px, 3vw, 20px)", 
    marginBottom: "clamp(15px, 3vw, 20px)", 
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)" 
  },
  formGrid: { 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
    gap: "clamp(10px, 2vw, 12px)", 
    marginBottom: "clamp(10px, 2vw, 12px)" 
  },
  input: { 
    padding: "clamp(10px, 2vw, 12px)", 
    borderRadius: "8px", 
    border: "1px solid #ddd", 
    fontSize: "clamp(14px, 2.5vw, 16px)",
    minHeight: "44px",
  },
  textarea: { 
    width: "100%", 
    padding: "clamp(10px, 2vw, 12px)", 
    borderRadius: "8px", 
    border: "1px solid #ddd", 
    fontSize: "clamp(14px, 2.5vw, 16px)", 
    resize: "vertical",
    minHeight: "100px",
  },
  formActions: { 
    display: "flex", 
    gap: "clamp(8px, 1.5vw, 10px)", 
    marginTop: "clamp(10px, 2vw, 15px)",
    flexWrap: "wrap",
  },
  tableContainer: { 
    overflowX: "auto", 
    background: "white", 
    borderRadius: "12px", 
    padding: "0", 
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    WebkitOverflowScrolling: "touch",
  },
  table: { 
    width: "100%", 
    borderCollapse: "separate", 
    borderSpacing: 0,
    minWidth: "800px",
  },
  loading: { 
    textAlign: "center", 
    padding: "clamp(20px, 4vw, 40px)", 
    color: "#666",
    fontSize: "clamp(14px, 3vw, 16px)",
  },
  noData: { 
    textAlign: "center", 
    padding: "clamp(15px, 3vw, 20px)", 
    color: "#999",
    fontSize: "clamp(12px, 2.5vw, 14px)",
  },
  publishBtn: { 
    padding: "clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px)", 
    borderRadius: "6px", 
    border: "none", 
    backgroundColor: "#4CAF50", 
    color: "white", 
    fontWeight: "500", 
    cursor: "pointer", 
    fontSize: "clamp(11px, 2vw, 12px)", 
    whiteSpace: "nowrap",
    minHeight: "36px",
  },
  actionBtn: { 
    padding: "clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px)", 
    borderRadius: "6px", 
    border: "1px solid #0477BF", 
    backgroundColor: "transparent", 
    color: "#0477BF", 
    fontWeight: "500", 
    cursor: "pointer", 
    fontSize: "clamp(11px, 2vw, 12px)", 
    whiteSpace: "nowrap",
    minHeight: "36px",
  },
  dangerBtn: { 
    padding: "clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px)", 
    borderRadius: "6px", 
    border: "none", 
    backgroundColor: "#f44336", 
    color: "white", 
    fontWeight: "500", 
    cursor: "pointer", 
    fontSize: "clamp(11px, 2vw, 12px)", 
    whiteSpace: "nowrap",
    minHeight: "36px",
  },
  select: { 
    width: "100%", 
    padding: "clamp(10px, 2vw, 12px)", 
    borderRadius: "8px", 
    border: "1px solid #ddd", 
    fontSize: "clamp(14px, 2.5vw, 16px)", 
    backgroundColor: "white", 
    cursor: "pointer",
    minHeight: "44px",
  },
  row: { transition: "background 0.15s", borderBottom: "1px solid #f0f0f0" },
  headerRowStrip: { background: "#f8f9fb" },
  th: { 
    textAlign: 'left', 
    padding: 'clamp(10px, 2vw, 14px) clamp(12px, 2.5vw, 16px)', 
    fontSize: "clamp(12px, 2.5vw, 14px)", 
    color: '#2e236c' 
  },
  td: { 
    verticalAlign: 'top', 
    padding: 'clamp(10px, 2vw, 14px) clamp(12px, 2.5vw, 16px)', 
    fontSize: "clamp(12px, 2.5vw, 14px)", 
    color: '#333' 
  },
  cellTitle: { fontWeight: 600, color: "#2e236c", fontSize: "clamp(12px, 2.5vw, 14px)" },
  cellSub: { fontSize: "clamp(10px, 2vw, 12px)", color: "#777", marginTop: 4 },
  badge: { 
    background: "#eef2ff", 
    color: "#3347b0", 
    padding: "clamp(4px, 1vw, 6px) clamp(8px, 1.5vw, 10px)", 
    borderRadius: 14, 
    fontSize: "clamp(10px, 2vw, 12px)", 
    fontWeight: 600 
  },
  pill: { 
    background: "#e8f5e9", 
    color: "#2e7d32", 
    padding: "clamp(4px, 1vw, 6px) clamp(8px, 1.5vw, 10px)", 
    borderRadius: 14, 
    fontSize: "clamp(10px, 2vw, 12px)", 
    fontWeight: 600 
  },
  actionsCell: { 
    display: 'flex', 
    gap: "clamp(4px, 1vw, 6px)", 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    whiteSpace: 'nowrap',
    flexWrap: "wrap",
  },
  modalOverlay: { 
    position: 'fixed', 
    inset: 0, 
    background: 'rgba(0,0,0,0.35)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 1000,
    padding: "10px",
  },
  modalCard: { 
    background: 'white', 
    padding: "clamp(15px, 3vw, 20px)", 
    borderRadius: 12, 
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)', 
    width: "100%",
    maxWidth: "420px",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  previewCard: { marginTop: 16, border: '1px solid #e6eefb', borderRadius: 12, overflow: 'hidden' },
  previewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fbff', padding: '12px 16px' },
  jobTitle: { fontWeight: 700, fontSize: 16, color: '#2e236c' },
  jobMeta: { color: '#666', fontSize: 12, marginTop: 4 },
  previewBody: { padding: 16 },
  previewSection: { marginTop: 8 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { padding: '6px 10px', borderRadius: 12, background: '#eef2ff', color: '#3347b0', fontSize: 12, fontWeight: 600 },
};

export default JobManagementPage;
