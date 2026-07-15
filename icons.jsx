// Minimal stroke icons, 18px default
const Icon = ({ name, size = 18, stroke = 1.6, className = "", style }) => {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", className, style };
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>,
    materia:   <><path d="M5 7l7-4 7 4-7 4-7-4z"/><path d="M5 7v10l7 4"/><path d="M19 7v10l-7 4"/></>,
    producto:  <><path d="M4 7h16v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></>,
    produccion:<><path d="M4 20h16"/><path d="M5 20V10l5-3v3l5-3v3l4-2v12"/><circle cx="9" cy="16" r="0.6"/><circle cx="14" cy="16" r="0.6"/></>,
    reportes:  <><path d="M4 20V8"/><path d="M10 20V4"/><path d="M16 20v-8"/><path d="M3 20h18"/></>,
    usuarios:  <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M15 20c0-2.5 2-4 4-4s4 1.5 4 4" transform="translate(-2 0)"/></>,
    search:    <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    plus:      <><path d="M12 5v14M5 12h14"/></>,
    filter:    <><path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/></>,
    download:  <><path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></>,
    edit:      <><path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14 6l4 4"/></>,
    trash:     <><path d="M4 7h16"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></>,
    arrowR:    <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
    chevD:     <><path d="M6 9l6 6 6-6"/></>,
    bell:      <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
    settings:  <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.4l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.6 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    check:     <><path d="M5 12l5 5 9-11"/></>,
    x:         <><path d="M6 6l12 12M6 18L18 6"/></>,
    alert:     <><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5"/><circle cx="12" cy="18" r="0.6"/></>,
    calc:      <><rect x="5" y="3" width="14" height="18" rx="2"/><rect x="8" y="6" width="8" height="3"/><path d="M9 13h.01M12 13h.01M15 13h.01M9 16h.01M12 16h.01M15 16h6"/></>,
    arrowUp:   <><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></>,
    arrowDn:   <><path d="M12 5v14"/><path d="M6 13l6 6 6-6"/></>,
    sparkle:   <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/></>,
    box:       <><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></>,
    flask:     <><path d="M9 3h6"/><path d="M10 3v6L4 20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1L14 9V3"/></>,
    eye:       <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>
  };
  return <svg {...common}>{paths[name] || null}</svg>;
};

window.Icon = Icon;
