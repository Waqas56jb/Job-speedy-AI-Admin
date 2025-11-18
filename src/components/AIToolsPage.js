import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/i18n";

const AIToolsPage = () => {
  const { language } = useLanguage();
  const [description, setDescription] = useState("");
  const [generatedJob, setGeneratedJob] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [postStatus, setPostStatus] = useState("idle"); // 🔹 added: idle | posting | posted
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [matchedCandidates, setMatchedCandidates] = useState([]);
  const [matching, setMatching] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [extractedResume, setExtractedResume] = useState(null);
  const [showRefresh, setShowRefresh] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:4000/api/jobs");
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs || []);
        }
      } catch (_) {}
    })();
  }, []);

  // 🔹 Generate job using backend AI API
  const handleGenerateJobAd = async () => {
    if (!description.trim()) {
      alert(language === 'de' ? 'Bitte geben Sie eine Stellenbeschreibung ein' : 'Please enter a job description');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("http://localhost:4000/api/jobs/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedJob(data.jobAd);
      } else {
        const error = await res.json();
        alert(error.error || (language === 'de' ? 'Stellenanzeige konnte nicht generiert werden' : 'Failed to generate job ad'));
      }
    } catch (err) {
      console.error("Error generating job ad:", err);
      alert(language === 'de' ? 'Stellenanzeige konnte nicht generiert werden. Bitte versuchen Sie es erneut.' : 'Failed to generate job ad. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 🔹 Post job to DB
  const handlePostJob = async () => {
    if (!generatedJob) return;

    setPostStatus("posting");
    try {
      const res = await fetch("http://localhost:4000/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedJob.title || "",
          company: generatedJob.company || "Your Company Name",
          description: generatedJob.description || "",
          required_skills: generatedJob.required_skills || "",
          location: generatedJob.location || "Not specified",
          job_type: generatedJob.job_type || "Full-time",
          category: generatedJob.category || "General",
          language: generatedJob.language || "English",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        // 🔹 show "Posted" instead of alert
        setPostStatus("posted");
        setDescription("");
        setGeneratedJob(null);
        // reset to idle after 3s
        setTimeout(() => setPostStatus("idle"), 3000);
      } else {
        console.error(data.error);
        setPostStatus("idle");
      }
    } catch (err) {
      console.error("Error posting job:", err);
      setPostStatus("idle");
    }
  };

  const handleMatchCandidates = async () => {
    if (!selectedJob) { alert(language === 'de' ? 'Bitte wählen Sie eine Stelle aus' : 'Please select a job'); return; }
    setMatching(true);
    setMatchedCandidates([]);
    try {
      const res = await fetch(`http://localhost:4000/api/jobs/${selectedJob}/candidates`);
      if (res.ok) {
        const data = await res.json();
        setMatchedCandidates(data.candidates || []);
      }
    } catch (e) { console.error(e); }
    finally { setMatching(false); }
  };

  const handleExtractSkills = async () => {
    if (!uploadedFile) {
      alert(language === 'de' ? 'Bitte laden Sie zuerst einen PDF-Lebenslauf hoch.' : 'Please upload a PDF resume first.');
      return;
    }
    if (uploadedFile.type !== 'application/pdf') {
      alert(language === 'de' ? 'Bitte laden Sie eine PDF-Datei hoch.' : 'Please upload a PDF file.');
      return;
    }
    setIsExtracting(true);
    try {
      const form = new FormData();
      form.append('resume', uploadedFile);
      const res = await fetch('http://localhost:4000/api/tools/extract-skills', {
        method: 'POST',
        body: form,
      });
      const ct = res.headers.get('content-type') || '';
      const payload = ct.includes('application/json') ? await res.json() : { error: await res.text() };
      if (!res.ok) throw new Error(payload.error || 'Failed to extract skills');
      const parsed = payload.parsed || {};
      setExtractedResume(parsed);
      setExtractedSkills(Array.isArray(parsed.skills) ? parsed.skills : []);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDownloadSkills = () => {
    const text = extractedSkills.join(', ');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_skills.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowRefresh(true);
  };

  const handleRefreshExtraction = () => {
    setExtractedResume(null);
    setExtractedSkills([]);
    setUploadedFile(null);
    setShowRefresh(false);
  };

  return (
    <Layout>
      <div style={styles.container}>
        {/* Success Banner */}
        {postStatus === "posted" && (
          <div style={styles.successBanner}>
            ✅ {language === 'de' ? 'Stelle erfolgreich auf der JobSpeedy AI-Website veröffentlicht!' : 'Job posted successfully on the JobSpeedy AI website!'}
          </div>
        )}
        
        <h2 style={styles.mainHeader}>{t(language, 'aiTools.title')}</h2>

        {/* ==================== AI Job Post Generator ==================== */}
        <div style={styles.moduleCard}>
          <h3 style={styles.moduleHeader}>🤖 {t(language, 'aiTools.jobGenerator')}</h3>
          <p style={styles.moduleDescription}>
            {t(language, 'aiTools.jobGeneratorDesc')}
          </p>

          <div style={styles.inputGroup}>
            <textarea
              placeholder="e.g., 'Looking for an experienced React developer to join our team...' or 'Need a registered nurse for our healthcare facility...'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.textarea}
              rows="4"
            />
            <button
              style={{ ...styles.actionBtn, ...styles.generateBtn }}
              onClick={handleGenerateJobAd}
              disabled={isGenerating || !description.trim()}
            >
              {isGenerating ? `✨ ${t(language, 'aiTools.generating')}` : `✨ ${t(language, 'aiTools.generateJobPost')}`}
            </button>
          </div>

          {/* ==================== Preview Section ==================== */}
          {generatedJob && (
            <div style={styles.previewSection}>
              <div style={styles.previewHeader}>
                <h4 style={styles.previewTitle}>📋 {language === 'de' ? 'Generierte Stellenanzeige-Vorschau' : 'Generated Job Post Preview'}</h4>
                <button
                  style={styles.closeBtn}
                  onClick={() => setGeneratedJob(null)}
                >
                  ✕
                </button>
              </div>

              <div style={styles.previewContent}>
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>{language === 'de' ? 'Stellentitel:' : 'Job Title:'}</span>
                  <span style={styles.previewValue}>{generatedJob.title || "N/A"}</span>
                </div>

                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>{language === 'de' ? 'Unternehmen:' : 'Company:'}</span>
                  <span style={styles.previewValue}>{generatedJob.company || "N/A"}</span>
                </div>

                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>{language === 'de' ? 'Standort:' : 'Location:'}</span>
                  <span style={styles.previewValue}>{generatedJob.location || "N/A"}</span>
                </div>

                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>{language === 'de' ? 'Stellentyp:' : 'Job Type:'}</span>
                  <span style={styles.previewValue}>{generatedJob.job_type || "N/A"}</span>
                </div>

                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>{language === 'de' ? 'Kategorie:' : 'Category:'}</span>
                  <span style={styles.previewValue}>{generatedJob.category || "N/A"}</span>
                </div>

                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>{language === 'de' ? 'Erforderliche Fähigkeiten:' : 'Required Skills:'}</span>
                  <span style={styles.previewValue}>{generatedJob.required_skills || "N/A"}</span>
                </div>


                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>{language === 'de' ? 'Sprache:' : 'Language:'}</span>
                  <span style={styles.previewValue}>{generatedJob.language || "N/A"}</span>
                </div>

                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>{language === 'de' ? 'Beschreibung:' : 'Description:'}</span>
                  <p style={styles.previewDescription}>{generatedJob.description || "N/A"}</p>
                </div>
              </div>

              <div style={styles.previewActions}>
                <button
                  style={{
                    ...styles.postBtn,
                    backgroundColor:
                      postStatus === "posted"
                        ? "#28a745"
                        : postStatus === "posting"
                        ? "#007bff"
                        : "#4CAF50",
                    cursor: postStatus === "posting" ? "not-allowed" : "pointer",
                  }}
                  onClick={handlePostJob}
                  disabled={postStatus === "posting"}
                >
                  {postStatus === "posting"
                    ? (language === 'de' ? "📤 Wird veröffentlicht..." : "📤 Posting...")
                    : postStatus === "posted"
                    ? "✅ " + (language === 'de' ? 'Veröffentlicht' : 'Posted')
                    : "📤 " + (language === 'de' ? 'Stelle veröffentlichen' : 'Post Job')}
                </button>
                <button
                  style={styles.editBtn}
                  onClick={() => setGeneratedJob(null)}
                >
                  {language === 'de' ? 'Beschreibung bearbeiten' : 'Edit Description'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ==================== Match Candidates ==================== */}
        <div style={styles.moduleCard}>
          <h3 style={styles.moduleHeader}>{t(language, 'aiTools.matchCandidates')}</h3>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            style={styles.select}
          >
            <option value="">{t(language, 'aiTools.selectJob')}</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} — {job.company}
              </option>
            ))}
          </select>
          <button style={styles.actionBtn} onClick={handleMatchCandidates}>
            {matching ? t(language, 'aiTools.searching') : t(language, 'aiTools.showTopCandidates')}
          </button>
          {matchedCandidates.length > 0 && (
            <div style={{ marginTop: "14px", overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th style={styles.th}>{language === 'de' ? 'Name' : 'Name'}</th>
                    <th style={styles.th}>{language === 'de' ? 'E-Mail' : 'Email'}</th>
                    <th style={styles.th}>{language === 'de' ? 'Beworben' : 'Applied'}</th>
                    <th style={styles.th}>{language === 'de' ? 'Top-Fähigkeiten (analysiert)' : 'Top Skills (parsed)'}</th>
                  </tr>
                </thead>
                <tbody>
                  {matchedCandidates.map((c) => {
                    const skills = (c.ai_parsed_data?.skills) || [];
                    const skillList = Array.isArray(skills) ? skills.slice(0,5) : (typeof skills === 'string' ? skills.split(',').map(s=>s.trim()).slice(0,5) : []);
                    return (
                      <tr key={c.application_id}>
                        <td style={styles.td}>{c.full_name}</td>
                        <td style={styles.td}>{c.email}</td>
                        <td style={styles.td}>{new Date(c.applied_at).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          <div style={styles.chips}>{skillList.map((s,i)=> (<span key={i} style={styles.chip}>{s}</span>))}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ==================== Extract Skills ==================== */}
        <div style={styles.moduleCard}>
          <h3 style={styles.moduleHeader}>{t(language, 'aiTools.extractSkills')}</h3>
          <p style={{ color: '#666', marginTop: -6, marginBottom: 12 }}>{t(language, 'aiTools.extractSkillsDesc')}</p>
          <input
            type="file"
            onChange={(e) => setUploadedFile(e.target.files[0])}
            style={styles.inputFile}
            accept="application/pdf"
          />
          <button style={styles.actionBtn} onClick={handleExtractSkills} disabled={isExtracting || !uploadedFile}>
            {isExtracting ? t(language, 'aiTools.extracting') : t(language, 'aiTools.extractData')}
          </button>
          {extractedResume && (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ margin: '8px 0', color: '#2e236c' }}>{language === 'de' ? 'Top-Fähigkeiten' : 'Top Skills'}</h4>
              <div style={styles.chips}>
                {extractedSkills.map((s, i) => (<span key={i} style={styles.chip}>{s}</span>))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 16, marginTop: 16 }}>
                <div>
                  <h4 style={{ margin: '8px 0', color: '#2e236c' }}>{language === 'de' ? 'Kontakt' : 'Contact'}</h4>
                  <div style={{ fontSize: 13, color: '#333' }}>
                    <div><strong>{language === 'de' ? 'Name:' : 'Name:'}</strong> {extractedResume?.contact?.name || '—'}</div>
                    <div><strong>{language === 'de' ? 'E-Mail:' : 'Email:'}</strong> {extractedResume?.contact?.email || '—'}</div>
                    <div><strong>{language === 'de' ? 'Telefon:' : 'Phone:'}</strong> {extractedResume?.contact?.phone || '—'}</div>
                    <div><strong>{language === 'de' ? 'Standort:' : 'Location:'}</strong> {extractedResume?.contact?.location || '—'}</div>
                  </div>
                </div>
                <div>
                  <h4 style={{ margin: '8px 0', color: '#2e236c' }}>{language === 'de' ? 'Bildung' : 'Education'}</h4>
                  {(extractedResume?.education || []).slice(0,3).map((e,i)=> (
                    <div key={i} style={{ fontSize: 13, color: '#333', marginBottom: 6 }}>
                      <div><strong>{e.degree || '—'}</strong></div>
                      <div>{e.institution || '—'} {e.year ? `(${e.year})` : ''}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 style={{ margin: '8px 0', color: '#2e236c' }}>{language === 'de' ? 'Zertifizierungen' : 'Certifications'}</h4>
                  <div style={styles.chips}>
                    {(extractedResume?.certifications || []).slice(0,6).map((c,i)=> (<span key={i} style={styles.chip}>{c}</span>))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <h4 style={{ margin: '8px 0', color: '#2e236c' }}>{language === 'de' ? 'Aktuelle Erfahrung' : 'Recent Experience'}</h4>
                {(extractedResume?.experience || []).slice(0,3).map((exp,i)=> (
                  <div key={i} style={{ padding: '10px 12px', border: '1px solid #eee', borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, color: '#2e236c' }}>{exp.title || '—'} {exp.company ? `— ${exp.company}` : ''}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{[exp.start_date, exp.end_date].filter(Boolean).join(' - ')}</div>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(exp.responsibilities || []).slice(0,6).map((r,ri)=> (<span key={ri} style={styles.chip}>{r}</span>))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap: 10, marginTop: 12 }}>
                <button style={{ ...styles.actionBtn }} onClick={handleDownloadSkills}>{t(language, 'aiTools.downloadSkills')}</button>
                {showRefresh && (
                  <button style={{ ...styles.actionBtn }} onClick={handleRefreshExtraction}>{t(language, 'aiTools.refresh')}</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

// ====== STYLES (unchanged) ======
const styles = {
  container: { padding: "20px 0" },
  successBanner: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    backgroundColor: "#25D366",
    color: "white",
    padding: "15px 20px",
    marginBottom: "20px",
    borderRadius: "8px",
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  mainHeader: { fontSize: "28px", marginBottom: "30px", fontWeight: "bold", color: "#2e236c" },
  moduleCard: { background: "white", borderRadius: "12px", padding: "30px", marginBottom: "30px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  moduleHeader: { fontSize: "22px", marginBottom: "10px", fontWeight: "bold", color: "#2e236c" },
  moduleDescription: { fontSize: "14px", color: "#666", marginBottom: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "15px" },
  textarea: { width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", fontFamily: "inherit", resize: "vertical", transition: "border-color 0.2s" },
  select: { width: "100%", padding: "12px 15px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px" },
  inputFile: { marginBottom: "10px" },
  actionBtn: { padding: "12px 24px", borderRadius: "8px", border: "none", backgroundColor: "#0477BF", color: "#fff", fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease", fontSize: "14px" },
  generateBtn: { fontSize: "16px", padding: "14px 28px" },
  previewSection: { marginTop: "30px", padding: "25px", backgroundColor: "#f8f9fa", borderRadius: "12px", border: "1px solid #e0e0e0" },
  previewHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  previewTitle: { fontSize: "18px", fontWeight: "600", color: "#2e236c", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#999", padding: "0", width: "24px", height: "24px" },
  previewContent: { display: "flex", flexDirection: "column", gap: "15px" },
  previewItem: { display: "flex", flexDirection: "column", gap: "5px" },
  previewLabel: { fontSize: "13px", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" },
  previewValue: { fontSize: "16px", fontWeight: "500", color: "#2e236c" },
  previewDescription: { fontSize: "14px", color: "#555", lineHeight: "1.6", margin: 0 },
  previewActions: { display: "flex", gap: "12px", marginTop: "20px" },
  postBtn: { padding: "12px 24px", borderRadius: "8px", border: "none", backgroundColor: "#4CAF50", color: "#fff", fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease", fontSize: "14px" },
  editBtn: { padding: "12px 24px", borderRadius: "8px", border: "1px solid #ddd", backgroundColor: "white", color: "#666", fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease", fontSize: "14px" },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: 13, color: '#2e236c' },
  td: { padding: '10px 12px', fontSize: 13, color: '#333' },
  pillSmall: { background: '#eef7ee', color: '#2e7d32', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  chip: { padding: '4px 8px', borderRadius: 12, background: '#eef2ff', color: '#3347b0', fontSize: 12, fontWeight: 600 },
};

export default AIToolsPage;
