import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import waveImg from "../assets/wave.png";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/i18n";

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  // Handle window resize - close sidebar on desktop, keep state on mobile
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Check on mount
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
    <div style={styles.page} data-page>
      {/* Top Section with Logo and Navbar */}
      <div style={styles.topSection} data-top-section>
        {/* Mobile Menu Button */}
        <button 
          style={styles.menuButton}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
          data-menu-button
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        
        {/* Logo */}
        <div style={styles.logo} data-logo>
          <div style={styles.logoText} data-logo-text>JOBspeedy AI</div>
        </div>
        
        {/* Top Navbar */}
        <nav style={styles.topNavbar} data-top-navbar>
          <div style={styles.topRight} data-top-right>
            <button 
              style={styles.languageBtn} 
              onClick={toggleLanguage}
              title={t(language, 'common.language')}
            >
              🌐 {language.toUpperCase()}
            </button>
            <span style={styles.topBarItem} data-top-bar-item>{t(language, 'common.admin')}</span>
            <button style={styles.logoutBtn} onClick={handleButtonClick}>
              {t(language, 'common.logout')}
            </button>
          </div>
        </nav>
      </div>
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          style={styles.overlay}
          onClick={(e) => {
            // Only close if clicking on overlay, not on sidebar
            if (e.target === e.currentTarget) {
              setSidebarOpen(false);
            }
          }}
          onTouchStart={(e) => {
            // Prevent touch events from propagating to sidebar
            if (e.target === e.currentTarget) {
              e.stopPropagation();
            }
          }}
          data-overlay
        />
      )}

      {/* Sidebar + Main */}
      <div style={styles.contentWrapper} data-content-wrapper>
        {/* Sidebar */}
        <div 
          style={{
            ...styles.sidebar,
            ...(sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed)
          }}
          data-sidebar
          onClick={(e) => {
            // Prevent clicks inside sidebar from closing it
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            // Allow touch events on sidebar
            e.stopPropagation();
          }}
        >
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNavigate(item.key);
                  setSidebarOpen(false);
                }}
                onTouchStart={(e) => {
                  // iOS touch feedback
                  e.currentTarget.style.opacity = "0.7";
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
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
        <div 
          style={{
            ...styles.main,
            ...(sidebarOpen ? styles.mainWithSidebarOpen : {})
          }}
          data-main-content
        >
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
    width: "100%",
    overflowX: "hidden",
    boxSizing: "border-box",
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
  menuButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    padding: "10px 15px",
    color: "#2e236c",
    minWidth: "44px",
    minHeight: "44px",
    WebkitTapHighlightColor: "transparent",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0px 20px",
    minWidth: "200px",
    height: "100%",
    flex: "0 0 auto",
  },
  logoText: {
    fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: "clamp(20px, 4vw, 32px)",
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
    padding: "15px 20px",
    flex: 1,
    height: "100%",
    gap: "10px",
  },
  topRight: { 
    display: "flex", 
    alignItems: "center", 
    gap: "10px",
    flexWrap: "wrap",
  },
  topBarItem: { 
    fontWeight: 500, 
    color: "#2e236c",
    fontSize: "clamp(12px, 2vw, 14px)",
    display: "none",
  },
  languageBtn: {
    background: "transparent",
    color: "#2e236c",
    border: "1px solid #ddd",
    borderRadius: "25px",
    padding: "8px 12px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontWeight: 500,
    fontSize: "clamp(12px, 2vw, 14px)",
    minWidth: "44px",
    minHeight: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtn: {
    background: "#0477BF",
    color: "#fff",
    border: "none",
    borderRadius: "25px",
    padding: "8px 16px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontSize: "clamp(12px, 2vw, 14px)",
    minWidth: "44px",
    minHeight: "44px",
    whiteSpace: "nowrap",
  },
  contentWrapper: { 
    display: "flex", 
    marginTop: "80px",
    minHeight: "calc(100vh - 80px)",
    width: "100%",
    boxSizing: "border-box",
    overflowX: "hidden",
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
    transition: "transform 0.3s ease",
    zIndex: 1001,
    WebkitOverflowScrolling: "touch",
    pointerEvents: "auto",
    touchAction: "pan-y",
  },
  sidebarOpen: {
    transform: "translateX(0)",
  },
  sidebarClosed: {
    transform: "translateX(-100%)",
  },
  sidebarItem: {
    cursor: "pointer",
    color: "#555",
    fontWeight: "bold",
    fontSize: "clamp(14px, 2vw, 16px)",
    textAlign: "left",
    padding: "12px 12px",
    borderRadius: "8px",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    minHeight: "44px",
    pointerEvents: "auto",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "rgba(0, 131, 255, 0.2)",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  main: { 
    flex: 1, 
    padding: "clamp(15px, 3vw, 40px)",
    marginLeft: "220px",
    overflowY: "auto",
    minHeight: "calc(100vh - 80px)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    WebkitOverflowScrolling: "touch",
  },
  mainWithSidebarOpen: {
    marginLeft: "0",
  },
  overlay: {
    position: "fixed",
    top: "80px",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
    width: "100%",
    height: "calc(100vh - 80px)",
    pointerEvents: "auto",
    touchAction: "auto",
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

// Media query styles - Using data attributes for better control
const mediaQueries = `
  @media (min-width: 768px) {
    [data-menu-button] {
      display: none !important;
    }
    [data-top-bar-item] {
      display: inline !important;
    }
    [data-sidebar] {
      transform: translateX(0) !important;
    }
    [data-main-content] {
      margin-left: 220px !important;
    }
    [data-overlay] {
      display: none !important;
    }
  }
  
  @media (max-width: 767px) {
    [data-menu-button] {
      display: flex !important;
      align-items: center;
      justify-content: center;
    }
    [data-logo] {
      padding: 0px 10px !important;
      min-width: auto !important;
      flex: 1 !important;
    }
    [data-top-navbar] {
      padding: 15px 10px !important;
    }
    [data-top-right] {
      gap: 8px !important;
    }
    [data-main-content] {
      margin-left: 0 !important;
      padding: 15px !important;
      width: 100% !important;
    }
    [data-sidebar] {
      width: 280px !important;
      max-width: 85vw !important;
    }
    [data-content-wrapper] {
      width: 100% !important;
    }
  }
  
  @media (max-width: 480px) {
    [data-logo-text] {
      font-size: 18px !important;
    }
    [data-top-section] {
      height: 70px !important;
    }
    [data-content-wrapper] {
      margin-top: 70px !important;
    }
    [data-sidebar] {
      top: 70px !important;
      height: calc(100vh - 70px) !important;
      width: 100% !important;
      max-width: 85vw !important;
      padding: 20px 15px !important;
    }
    [data-main-content] {
      padding: 10px !important;
    }
    [data-top-right] {
      flex-wrap: wrap !important;
    }
  }
  
  @media (max-width: 375px) {
    [data-sidebar] {
      width: 100% !important;
      max-width: 100% !important;
    }
    [data-logo-text] {
      font-size: 16px !important;
    }
  }
  
  /* iOS specific fixes */
  @supports (-webkit-touch-callout: none) {
    [data-main-content],
    [data-sidebar] {
      -webkit-overflow-scrolling: touch;
    }
    [data-page] {
      position: fixed;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    [data-sidebar] {
      z-index: 1001 !important;
      pointer-events: auto !important;
    }
    [data-overlay] {
      z-index: 1000 !important;
    }
    [data-sidebar] > div {
      pointer-events: auto !important;
      touch-action: manipulation !important;
    }
  }
`;

// Inject media queries
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = mediaQueries;
  document.head.appendChild(styleSheet);
}

export default Layout;
