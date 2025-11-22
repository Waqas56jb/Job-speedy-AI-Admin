import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/i18n";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalJobs: 0,
    activeClients: 0,
    totalApplications: 0,
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [candidatesRes, jobsRes, clientsRes, weeklyRes] = await Promise.all([
        fetch("https://admin-backend-wheat.vercel.app/api/candidates"),
        fetch("https://admin-backend-wheat.vercel.app/api/jobs"),
        fetch("https://admin-backend-wheat.vercel.app/api/clients"),
        fetch("https://admin-backend-wheat.vercel.app/api/jobs/stats/weekly"),
      ]);

      const candidatesData = await candidatesRes.json();
      const jobsData = await jobsRes.json();
      const clientsData = await clientsRes.json();
      const weeklyStats = await weeklyRes.json();
      
      let totalApplications = 0;
      if (candidatesData.candidates) {
        totalApplications = candidatesData.candidates.reduce(
          (sum, candidate) => sum + (parseInt(candidate.application_count) || 0),
          0
        );
      }

      setStats({
        totalCandidates: candidatesData.candidates?.length || 0,
        totalJobs: jobsData.jobs?.length || 0,
        activeClients: clientsData.clients?.length || 0,
        totalApplications: totalApplications,
      });

      // Process weekly data
      const processedWeekly = (weeklyStats.weekly || []).map((item, index) => ({
        week: `Week ${index + 1}`,
        applications: parseInt(item.count) || 0,
      }));
      setWeeklyData(processedWeekly);

      // no additional processing needed for pie chart
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (page) => {
    navigate(`/${page}`);
  };

  const widgets = [
    { title: t(language, 'dashboard.totalCandidates'), value: stats.totalCandidates, route: "candidates" },
    { title: t(language, 'dashboard.totalJobs'), value: stats.totalJobs, route: "jobs" },
    { title: t(language, 'dashboard.activeClients'), value: stats.activeClients, route: "clients" },
    { title: t(language, 'dashboard.totalApplications'), value: stats.totalApplications, route: "candidates" },
  ];

  const maxValue = weeklyData.length > 0 ? Math.max(...weeklyData.map(d => d.applications), 1) : 100;

  // Pie data for summary (candidates, jobs, clients, applications)
  const pieData = [
    { label: t(language, 'dashboard.totalCandidates'), value: stats.totalCandidates, color: '#6aa4ff' },
    { label: t(language, 'dashboard.totalJobs'), value: stats.totalJobs, color: '#4CAF50' },
    { label: t(language, 'dashboard.activeClients'), value: stats.activeClients, color: '#FF9800' },
    { label: t(language, 'dashboard.totalApplications'), value: stats.totalApplications, color: '#f44336' },
  ];
  const pieTotal = pieData.reduce((s, d) => s + (Number.isFinite(d.value) ? d.value : 0), 0) || 1;
  let acc = 0;
  const pieGradient = pieData.map(d => {
    const start = (acc / pieTotal) * 100;
    acc += d.value;
    const end = (acc / pieTotal) * 100;
    return `${d.color} ${start}% ${end}%`;
  }).join(', ');

  return (
    <Layout>
      <>
        <h2 style={styles.mainHeader}>{t(language, 'dashboard.title')}</h2>

        {/* Widgets */}
        <div style={styles.widgetsContainer}>
          {widgets.map((widget) => (
            <div
              key={widget.title}
              style={styles.widget}
              onClick={() => handleCardClick(widget.route)}
              onMouseOver={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, #a2d2ff, #6aa4ff)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(106,76,255,0.25)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, #cce6ff, #a2d2ff)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
            >
              <p style={styles.widgetValue}>{loading ? "..." : widget.value}</p>
              <p style={styles.widgetTitle}>{widget.title}</p>
            </div>
          ))}
        </div>

        {/* Graphs Container */}
        <div style={styles.graphsContainer} className="dashboard-graphs">
          {/* Applications Trend Chart */}
          <div style={styles.graphCard}>
            <div style={styles.graphHeader}>
              <h3 style={styles.graphTitle}>{t(language, 'dashboard.applicationsTrend')}</h3>
            </div>
            <div style={styles.graphWrapper}>
              <div style={styles.yAxis}>
                {[0, Math.ceil(maxValue * 0.25), Math.ceil(maxValue * 0.5), Math.ceil(maxValue * 0.75), Math.ceil(maxValue)].map((value) => (
                  <span key={value} style={styles.yAxisLabel}>{value}</span>
                ))}
              </div>
              <div style={styles.graphContainer}>
                {weeklyData.length > 0 ? (
                  <>
                    {/* Grid lines */}
                    <div style={styles.gridLines}>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} style={styles.gridLine} />
                      ))}
                    </div>
                    {/* Bars */}
                    <div style={styles.barsContainer}>
                      {weeklyData.map((item, index) => (
                        <div key={index} style={styles.barGroup}>
                          <div style={styles.labelContainer}>
                            <span style={styles.valueBubble}>{item.applications}</span>
                          </div>
                          <div style={styles.barContainer}>
                            <div
                              style={{
                                ...styles.bar,
                                height: `${Math.max((item.applications / maxValue) * 220, 10)}px`,
                                backgroundColor: "#6aa4ff",
                              }}
                            />
                          </div>
                          <span style={styles.weekLabel}>{item.week}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={styles.noData}>{language === 'de' ? 'Keine Bewerbungsdaten verfügbar' : 'No application data available'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Summary Pie Chart */}
          <div style={styles.graphCard}>
            <div style={styles.graphHeader}>
              <h3 style={styles.graphTitle}>{t(language, 'dashboard.overallDistribution')}</h3>
            </div>
            <div style={styles.pieRow}>
              <div style={{ ...styles.pieChart, backgroundImage: `conic-gradient(${pieGradient})` }} />
              <div style={styles.legend}>
                {pieData.map((d) => (
                  <div key={d.label} style={styles.legendItem}>
                    <span style={{ ...styles.legendSwatch, backgroundColor: d.color }} />
                    <span style={styles.legendLabel}>{d.label}</span>
                    <span style={styles.legendValue}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    </Layout>
  );
};

const styles = {
  mainHeader: { 
    fontSize: "clamp(18px, 4vw, 24px)", 
    marginBottom: "clamp(15px, 3vw, 20px)", 
    fontWeight: "bold", 
    color: "#2e236c" 
  },
  widgetsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "clamp(10px, 2vw, 20px)",
    marginBottom: "clamp(20px, 4vw, 30px)",
    width: "100%",
    boxSizing: "border-box",
  },
  widget: {
    background: "linear-gradient(135deg, #cce6ff, #a2d2ff)",
    borderRadius: "12px",
    padding: "clamp(15px, 3vw, 25px)",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "500",
    minHeight: "100px",
    width: "100%",
    boxSizing: "border-box",
    WebkitTapHighlightColor: "transparent",
  },
  widgetValue: { 
    fontSize: "clamp(24px, 5vw, 32px)", 
    fontWeight: "600", 
    marginBottom: "5px", 
    color: "#2e236c" 
  },
  widgetTitle: { 
    fontSize: "clamp(12px, 2.5vw, 16px)", 
    fontWeight: "500", 
    color: "#555" 
  },
  graphsContainer: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "clamp(15px, 3vw, 20px)",
    marginBottom: "clamp(20px, 4vw, 30px)",
  },
  graphCard: {
    background: "white",
    borderRadius: "16px",
    padding: "clamp(15px, 3vw, 30px)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "clamp(15px, 3vw, 30px)",
    width: "100%",
    overflowX: "auto",
    boxSizing: "border-box",
    WebkitOverflowScrolling: "touch",
  },
  graphHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "clamp(15px, 3vw, 25px)",
    flexWrap: "wrap",
    gap: "10px",
  },
  graphTitle: {
    fontSize: "clamp(16px, 3vw, 20px)",
    fontWeight: "600",
    margin: 0,
    color: "#2e236c",
  },
  timeFilter: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    backgroundColor: "white",
    fontSize: "clamp(12px, 2vw, 14px)",
    color: "#666",
    cursor: "pointer",
    minHeight: "44px",
  },
  graphWrapper: {
    display: "flex",
    gap: "clamp(10px, 2vw, 15px)",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    width: "100%",
    boxSizing: "border-box",
  },
  pieRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "clamp(10px, 2vw, 20px)",
    flexWrap: "wrap",
  },
  pieChart: {
    width: "clamp(150px, 30vw, 200px)",
    height: "clamp(150px, 30vw, 200px)",
    borderRadius: "50%",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    flexShrink: 0,
  },
  legend: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: "150px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  legendSwatch: {
    width: "12px",
    height: "12px",
    borderRadius: "3px",
    display: "inline-block",
    flexShrink: 0,
  },
  legendLabel: { 
    fontSize: "clamp(12px, 2vw, 14px)", 
    color: "#2e236c", 
    minWidth: "100px" 
  },
  legendValue: { 
    fontSize: "clamp(12px, 2vw, 14px)", 
    fontWeight: 600, 
    color: "#333" 
  },
  yAxis: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "clamp(200px, 40vw, 250px)",
    paddingTop: "20px",
    paddingBottom: "20px",
    minWidth: "30px",
    flexShrink: 0,
  },
  yAxisLabel: {
    fontSize: "clamp(10px, 2vw, 12px)",
    color: "#999",
    fontWeight: "500",
  },
  graphContainer: {
    flex: 1,
    position: "relative",
    height: "clamp(250px, 50vw, 290px)",
    padding: "20px 10px 30px 10px",
    minWidth: "0",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    width: "100%",
    boxSizing: "border-box",
  },
  gridLines: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    bottom: 30,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  gridLine: {
    width: "100%",
    height: "1px",
    backgroundColor: "#f0f0f0",
  },
  barsContainer: {
    position: "relative",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: "100%",
    zIndex: 1,
    minWidth: "280px",
    width: "100%",
    boxSizing: "border-box",
  },
  barGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    gap: "5px",
    position: "relative",
    minWidth: "40px",
  },
  labelContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "35px",
    marginBottom: "5px",
  },
  valueBubble: {
    fontSize: "clamp(10px, 2vw, 13px)",
    fontWeight: "600",
    color: "#2e236c",
    backgroundColor: "#e3f2fd",
    border: "1px solid #90caf9",
    borderRadius: "50%",
    width: "clamp(30px, 6vw, 36px)",
    height: "clamp(30px, 6vw, 36px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  barContainer: {
    width: "100%",
    height: "clamp(180px, 35vw, 220px)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  bar: {
    width: "55%",
    maxWidth: "45px",
    borderRadius: "6px 6px 0 0",
    transition: "all 0.3s ease",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(106, 164, 255, 0.2)",
  },
  weekLabel: {
    fontSize: "clamp(10px, 2vw, 12px)",
    fontWeight: "500",
    color: "#666",
    marginTop: "8px",
  },
  noData: {
    textAlign: "center",
    color: "#999",
    fontSize: "clamp(14px, 3vw, 16px)",
    padding: "clamp(20px, 4vw, 40px)",
  },
};

export default AdminDashboard;
