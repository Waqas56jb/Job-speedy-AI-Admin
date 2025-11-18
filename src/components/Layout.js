import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import waveImg from "../assets/wave.png";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/i18n";

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();
  
  const getSidebarItems = () => [
    { label: t(language, 'sidebar.dashboard'), key: "dashboard" },
    { label: t(language, 'sidebar.candidates'), key: "candidates" },
    { label: t(language, 'sidebar.jobs'), key: "jobs" },
    { label: t(language, 'sidebar.aiTools'), key: "ai-tools" },
    { label: t(language, 'sidebar.clients'), key: "clients" },
  ];

  const renderIcon = (key) => {
    const fill = "#0083FF";
    const common = { width: 18, height: 18, viewBox: "0 0 24 24", style: { marginRight: 10, flexShrink: 0 } };
    switch (key) {
      case "dashboard":
        return (
          <svg {...common} xmlns="http://www.w3.org/2000/svg"><path fill={fill} d="M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z"/></svg>
        );
      case "candidates":
        return (
          <svg {...common} xmlns="http://www.w3.org/2000/svg"><path fill={fill} d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5z"/></svg>
        );
      case "jobs":
        return (
          <svg {...common} xmlns="http://www.w3.org/2000/svg"><path fill={fill} d="M20 6h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v2h20V8a2 2 0 0 0-2-2zM8 4h8v2H8V4zm-6 8v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6H2z"/></svg>
        );
      case "ai-tools":
        return (
          <svg {...common} xmlns="http://www.w3.org/2000/svg"><path fill={fill} d="M12 2l2.09 6.26L20 9l-4.91 3.57L16.18 20 12 16.9 7.82 20l1.09-7.43L4 9l5.91-.74L12 2z"/></svg>
        );
      case "clients":
        return (
          <svg {...common} xmlns="http://www.w3.org/2000/svg"><path fill={fill} d="M3 7h18v2H3V7zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/></svg>
        );
      default:
        return null;
    }
  };
  
  const handleNavigate = (key) => {
    const routes = {
      "dashboard": "/dashboard",
      "candidates": "/candidates",
      "jobs": "/jobs",
      "ai-tools": "/ai-tools",
      "clients": "/clients"
    };
    
    const route = routes[key];
    if (route) {
      navigate(route);
    }
  };

  const getSidebarItemStyle = (item) => {
    const routes = {
      "dashboard": "/dashboard",
      "candidates": "/candidates",
      "jobs": "/jobs",
      "ai-tools": "/ai-tools",
      "clients": "/clients"
    };
    
    const isActive = location.pathname === routes[item.key];
    
    return {
      ...styles.sidebarItem,
      ...(isActive && {
        background: "linear-gradient(90deg, rgba(0,178,255,0.15), rgba(0,131,255,0.25))",
        boxShadow: "0 4px 10px rgba(0,178,255,0.2)",
        color: "#0083FF"
      })
    };
  };

  const handleButtonClick = (e) => {
    const btn = e.currentTarget;
    if (btn) btn.style.transform = "scale(0.95)";
    setTimeout(() => {
      if (btn) btn.style.transform = "scale(1)";
      try {
        localStorage.removeItem('isAuthenticated');
        window.dispatchEvent(new Event('storage'));
      } catch (_) {}
      navigate('/login', { replace: true });
    }, 150);
  };

  return (
    <div style={styles.page}>
      {/* Top Section with Logo and Navbar */}
      <div style={styles.topSection}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoText}>JOBspeedy AI</div>
        </div>
        
        {/* Top Navbar */}
        <nav style={styles.topNavbar}>
          <div style={styles.topRight}>
            <button 
              style={styles.languageBtn} 
              onClick={toggleLanguage}
              title={t(language, 'common.language')}
            >
              🌐 {language.toUpperCase()}
            </button>
            <span style={styles.topBarItem}>{t(language, 'common.admin')}</span>
            <button style={styles.logoutBtn} onClick={handleButtonClick}>
              {t(language, 'common.logout')}
            </button>
          </div>
        </nav>
      </div>

      {/* Sidebar + Main */}
      <div style={styles.contentWrapper}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          {getSidebarItems().map((item) => {
            const routes = {
              "dashboard": "/dashboard",
              "candidates": "/candidates",
              "jobs": "/jobs",
              "ai-tools": "/ai-tools",
              "clients": "/clients"
            };
            const isActive = location.pathname === routes[item.key];
            return (
              <div
                key={item.key}
                style={getSidebarItemStyle(item)}
                onClick={() => handleNavigate(item.key)}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background =
                      "linear-gradient(90deg, rgba(0,178,255,0.15), rgba(0,131,255,0.25))";
                    e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,178,255,0.2)";
                    e.currentTarget.style.color = "#0083FF";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.color = "#555";
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, width: '100%' }}>
                  {renderIcon(item.key)}
                  <span>{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div style={styles.main}>
          {children}
        </div>
      </div>

      {/* Wave Background */}
      <div style={styles.waveContainer}>
        <img src={waveImg} alt="wave background" style={styles.wave} />
      </div>
    </div>
  );
};

const styles = {
  page: {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f8f8ff",
    color: "#2e236c",
    minHeight: "100vh",
    position: "relative",
  },
  topSection: {
    display: "flex",
    alignItems: "center",
    background: "white",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: "80px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0px 40px",
    minWidth: "280px",
    height: "100%",
  },
  logoText: {
    fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: "32px",
    fontWeight: "600",
    background: "linear-gradient(135deg, #00B2FF 0%, #0083FF 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.5px",
    lineHeight: "1.2",
  },
  topNavbar: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "15px 40px",
    flex: 1,
    height: "100%",
  },
  topRight: { display: "flex", alignItems: "center", gap: "15px" },
  topBarItem: { fontWeight: 500, color: "#2e236c" },
  languageBtn: {
    background: "transparent",
    color: "#2e236c",
    border: "1px solid #ddd",
    borderRadius: "25px",
    padding: "8px 16px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontWeight: 500,
    fontSize: "14px",
  },
  logoutBtn: {
    background: "#0477BF",
    color: "#fff",
    border: "none",
    borderRadius: "25px",
    padding: "8px 20px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  contentWrapper: { 
    display: "flex", 
    marginTop: "80px",
    minHeight: "calc(100vh - 80px)",
  },
  sidebar: { 
    width: "220px", 
    background: "white", 
    padding: "40px 20px 20px 20px", 
    display: "flex", 
    flexDirection: "column", 
    gap: "15px", 
    position: "fixed",
    top: "80px",
    left: 0,
    bottom: 0,
    height: "calc(100vh - 80px)",
    overflowY: "auto",
    boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
  },
  sidebarItem: {
    cursor: "pointer",
    color: "#555",
    fontWeight: "bold",
    fontSize: "16px",
    textAlign: "left",
    padding: "12px 12px",
    borderRadius: "8px",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
  },
  main: { 
    flex: 1, 
    padding: "40px",
    marginLeft: "220px",
    overflowY: "auto",
    minHeight: "calc(100vh - 80px)",
  },
  waveContainer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
    textAlign: "center",
    zIndex: -1,
    pointerEvents: "none",
  },
  wave: { width: "100%", height: "auto", display: "block" },
};

export default Layout;
