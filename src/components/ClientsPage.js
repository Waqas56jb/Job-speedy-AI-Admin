import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/i18n";

const ClientsPage = () => {
  const { language } = useLanguage();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ company: "", contact_person: "", email: "" });
  const [search, setSearch] = useState("");

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('https://admin-backend-wheat.vercel.app/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`https://admin-backend-wheat.vercel.app/api/clients${editing ? '/' + editing.id : ''}`, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.error || (language === 'de' ? 'Fehlgeschlagen' : 'Failed'));
      setShowForm(false); setEditing(null); setFormData({ company: "", contact_person: "", email: "" });
      await fetchClients();
    } catch (e2) { alert(e2.message); }
  };

  const normalized = (v) => (v || "").toString().toLowerCase();
  const displayedClients = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = normalized(search);
    return (
      normalized(c.company).includes(q) ||
      normalized(c.contact_person).includes(q) ||
      normalized(c.email).includes(q)
    );
  });

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'de' ? 'Diesen Kunden löschen?' : 'Delete this client?')) return;
    try {
      const res = await fetch(`https://admin-backend-wheat.vercel.app/api/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(language === 'de' ? 'Löschen fehlgeschlagen' : 'Delete failed');
      await fetchClients();
    } catch (e) { alert(e.message); }
  };

  return (
    <Layout>
      <>
                <div style={styles.headerRow}>
                  <h2 style={styles.mainHeader}>{t(language, 'clients.title')}</h2>
                  <button style={styles.addBtn} onClick={() => { setEditing(null); setFormData({ company: "", contact_person: "", email: "" }); setShowForm(true); }}>
                    + {t(language, 'clients.addClient')}
                  </button>
                </div>

                {/* Search aligned to the right half */}
                <div style={styles.searchRow}>
                  <div style={styles.searchGroup}>
                    <input
                      type="text"
                      placeholder={language === 'de' ? 'Nach Unternehmen, Kontakt oder E-Mail suchen...' : 'Search by company, contact, or email...'}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                      style={styles.searchInput}
                    />
                    <button style={styles.searchBtn} onClick={() => setSearch(search)}>{t(language, 'clients.search')}</button>
                  </div>
                </div>

        {/* Add Client Form */}
                {showForm && (
          <div style={styles.formContainer}>
            <h3 style={styles.formHeader}>{language === 'de' ? 'Neuen Kunden hinzufügen' : 'Add New Client'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formRow}>
                <input
                  type="text"
                          name="company"
                          placeholder={`${t(language, 'clients.company')} *`}
                          value={formData.company}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder={`${t(language, 'clients.email')} *`}
                  value={formData.email}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formRow}>
                        <input type="text" name="contact_person" placeholder={t(language, 'clients.contactPerson')} value={formData.contact_person} onChange={handleInputChange} style={styles.input} />
              </div>
              <div style={styles.formActions} className="responsive-form-actions">
                <button type="submit" style={styles.submitBtn}>
                          {editing ? (language === 'de' ? 'Änderungen speichern' : 'Save Changes') : t(language, 'clients.addClient')}
                </button>
                        <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>
                  {t(language, 'jobs.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* removed old search bar */}

        {/* Clients Table */}
                <div style={styles.tableContainer} className="clients-table-container">
                  <table style={styles.table} className="clients-table">
                    <thead>
                      <tr style={styles.headerRowStrip}>
                        <th style={{...styles.th, width: '32%'}}>{t(language, 'clients.company')}</th>
                        <th style={{...styles.th, width: '22%'}}>{t(language, 'clients.contactPerson')}</th>
                        <th style={{...styles.th, width: '28%'}}>{t(language, 'clients.email')}</th>
                        <th style={{...styles.th, width: '10%', textAlign: 'center'}}>{t(language, 'clients.totalJobs')}</th>
                        <th style={{...styles.th, width: '8%', textAlign: 'right'}}>{t(language, 'clients.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedClients.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: '#999' }}>
                            {t(language, 'clients.noClients')}
                          </td>
                        </tr>
                      ) : displayedClients.map((c) => (
                        <tr key={c.id} style={styles.row}>
                          <td style={styles.td}><div style={styles.cellTitle}>{c.company}</div></td>
                          <td style={styles.td}>{c.contact_person || '—'}</td>
                          <td style={styles.td}><a href={`mailto:${c.email || ''}`} style={styles.link}>{c.email || '—'}</a></td>
                          <td style={{...styles.td, textAlign: 'center'}}>
                            <span style={styles.countPill}>{c.jobs_count || 0}</span>
                          </td>
                          <td style={{...styles.td}}>
                            <div style={styles.actionsCell}>
                              <button style={styles.actionBtn} onClick={() => { setEditing(c); setFormData({ company: c.company, contact_person: c.contact_person || '', email: c.email || '' }); setShowForm(true); }}>{t(language, 'clients.edit')}</button>
                              <button style={styles.dangerBtn} onClick={() => handleDelete(c.id)}>{t(language, 'clients.delete')}</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
      </>
    </Layout>
  );
};

const styles = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "clamp(15px, 3vw, 20px)",
    flexWrap: "wrap",
    gap: "10px",
  },
  searchRow: { 
    display: 'flex', 
    justifyContent: 'flex-end', 
    marginBottom: 'clamp(10px, 2vw, 12px)',
  },
  searchGroup: { 
    display: 'flex', 
    gap: 'clamp(8px, 1.5vw, 10px)', 
    width: '100%',
    maxWidth: '100%',
  },
  searchInput: { 
    flex: 1, 
    padding: 'clamp(10px, 2vw, 12px)', 
    borderRadius: '8px', 
    border: '1px solid #ddd', 
    fontSize: 'clamp(14px, 2.5vw, 16px)',
    minHeight: "44px",
  },
  searchBtn: { 
    padding: 'clamp(10px, 2vw, 12px) clamp(12px, 2.5vw, 16px)', 
    borderRadius: '8px', 
    border: 'none', 
    background: '#0477BF', 
    color: '#fff', 
    fontWeight: 600, 
    cursor: 'pointer',
    fontSize: "clamp(12px, 2.5vw, 14px)",
    minHeight: "44px",
    whiteSpace: "nowrap",
  },
  mainHeader: { 
    fontSize: "clamp(20px, 4vw, 24px)", 
    fontWeight: "bold" 
  },
  addBtn: {
    padding: "clamp(10px, 2vw, 12px) clamp(16px, 3vw, 20px)",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#0477BF",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontSize: "clamp(12px, 2.5vw, 14px)",
    minHeight: "44px",
    whiteSpace: "nowrap",
  },
  formContainer: {
    background: "white",
    padding: "clamp(15px, 3vw, 25px)",
    borderRadius: "12px",
    marginBottom: "clamp(15px, 3vw, 30px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  formHeader: {
    fontSize: "clamp(18px, 3.5vw, 20px)",
    fontWeight: "bold",
    marginBottom: "clamp(15px, 3vw, 20px)",
  },
  formRow: {
    display: "flex",
    gap: "clamp(10px, 2vw, 15px)",
    marginBottom: "clamp(10px, 2vw, 15px)",
    flexWrap: "wrap",
  },
  input: {
    flex: "1 1 200px",
    padding: "clamp(10px, 2vw, 12px) clamp(12px, 2.5vw, 15px)",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "clamp(14px, 2.5vw, 16px)",
    minHeight: "44px",
  },
  formActions: {
    display: "flex",
    gap: "clamp(10px, 2vw, 15px)",
    marginTop: "clamp(15px, 3vw, 20px)",
    flexWrap: "wrap",
  },
  submitBtn: {
    padding: "clamp(10px, 2vw, 12px) clamp(20px, 4vw, 25px)",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#0477BF",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "clamp(12px, 2.5vw, 14px)",
    minHeight: "44px",
    flex: "1 1 150px",
  },
  cancelBtn: {
    padding: "clamp(10px, 2vw, 12px) clamp(20px, 4vw, 25px)",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "white",
    color: "#666",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "clamp(12px, 2.5vw, 14px)",
    minHeight: "44px",
    flex: "1 1 150px",
  },
  
  tableContainer: {
    overflowX: "auto",
    background: "white",
    borderRadius: "12px",
    padding: "clamp(15px, 3vw, 20px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    WebkitOverflowScrolling: "touch",
  },
  table: { 
    width: "100%", 
    borderCollapse: "separate", 
    borderSpacing: 0, 
    fontSize: "clamp(14px, 2.5vw, 16px)",
    minWidth: "600px",
  },
  headerRowStrip: { background: "#f8f9fb" },
  th: { 
    textAlign: 'left', 
    padding: 'clamp(10px, 2vw, 14px) clamp(12px, 2.5vw, 16px)', 
    fontSize: "clamp(12px, 2.5vw, 14px)", 
    color: '#2e236c' 
  },
  td: { 
    padding: 'clamp(10px, 2vw, 14px) clamp(12px, 2.5vw, 16px)', 
    fontSize: "clamp(12px, 2.5vw, 14px)", 
    color: '#333', 
    verticalAlign: 'middle' 
  },
  statusBadge: {
    padding: "5px 12px",
    borderRadius: "15px",
    color: "white",
    fontSize: "14px",
    fontWeight: "bold",
  },
  row: { transition: 'background 0.15s', borderBottom: '1px solid #f0f0f0' },
  cellTitle: { fontWeight: 600, color: '#2e236c' },
  actionBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #0477BF",
    backgroundColor: "transparent",
    color: "#0477BF",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  dangerBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: "#f44336", color: "white", fontWeight: "bold", cursor: "pointer" },
  actionsCell: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  link: { color: '#2e236c', textDecoration: 'none' },
  badge: { background: "#eef2ff", color: "#3347b0", padding: "4px 10px", borderRadius: 14, fontSize: 12, fontWeight: 600 },
  countPill: { background: '#eef2ff', color: '#3347b0', padding: '6px 10px', borderRadius: 12, display: 'inline-block', minWidth: 26, textAlign: 'center', fontWeight: 700 },
};

export default ClientsPage;

