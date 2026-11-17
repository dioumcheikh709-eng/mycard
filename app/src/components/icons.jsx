/* Icônes au trait (couleur du texte). */
const I = ({ d, children, fill, sw = 1.8, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {d ? <path d={d} fill={fill || 'none'} /> : children}
  </svg>
);
export const IcoLibrary = () => (
  <I><rect x="3.6" y="7" width="10" height="13" rx="2" transform="rotate(-12 8.6 13.5)" opacity=".5" /><rect x="10.4" y="7" width="10" height="13" rx="2" transform="rotate(12 15.4 13.5)" opacity=".5" /><rect x="7" y="4.2" width="10" height="14.6" rx="2" fill="currentColor" fillOpacity=".16" /><path d="M12 8.6l.95 1.95 2.15.3-1.55 1.5.35 2.15L12 13.45 10.1 14.5l.35-2.15L8.9 10.85l2.15-.3z" fill="currentColor" stroke="none" /></I>
);
export const IcoContest = () => (
  <I><path d="M8 4h8v5.2a4 4 0 0 1-8 0z" fill="currentColor" fillOpacity=".16" /><path d="M8 5.6H5.2c0 2.9 1 4.4 3 4.8M16 5.6h2.8c0 2.9-1 4.4-3 4.8" /><path d="M12 13.2V16.6M9 20h6M9.8 16.6h4.4l.7 3.4H9.1z" /></I>
);
export const IcoShop = () => (
  <I><path d="M5.2 8.2h13.6l-1.1 10.9a1.9 1.9 0 0 1-1.9 1.7H8.2a1.9 1.9 0 0 1-1.9-1.7z" fill="currentColor" fillOpacity=".16" /><path d="M9 8.2V6.9a3 3 0 0 1 6 0v1.3" /><path d="M9.3 12.4a2.7 2.7 0 0 0 5.4 0" /></I>
);
export const IcoProfile = () => (<I><circle cx="12" cy="8.5" r="4" fill="currentColor" fillOpacity=".16" /><path d="M4.5 20c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6" /></I>);
export const IcoPlus = () => <I sw={2.4} d="M12 5v14M5 12h14" />;
export const IcoClose = () => <I sw={2.2} d="M6 6l12 12M18 6L6 18" />;
export const IcoBack = () => <I sw={2.2} d="M15 5l-7 7 7 7" />;
export const IcoChev = () => <I d="M9 6l6 6-6 6" />;
export const IcoSearch = () => <I><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></I>;
export const IcoSort = () => <I d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />;
export const IcoShare = () => <I><path d="M12 15V4M8 8l4-4 4 4" /><path d="M6 11v8a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19v-8" /></I>;
export const IcoDownload = () => <I><path d="M12 4v11M8 11l4 4 4-4" /><path d="M5 19.5h14" /></I>;
export const IcoGyro = () => <I><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M3.5 8.5c-1 2.3-1 4.7 0 7M20.5 8.5c1 2.3 1 4.7 0 7" /></I>;
export const IcoEdit = () => <I><path d="M4 20h4L19 9l-4-4L4 16z" fill="currentColor" fillOpacity=".16" /><path d="M13 7l4 4" /></I>;
export const IcoTrash = () => <I><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" /></I>;
export const IcoInfo = () => <I><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.6v.2" sw={2.4} /></I>;
export const IcoImage = () => <I><rect x="4" y="5" width="16" height="14" rx="2.5" /><circle cx="9" cy="10" r="1.6" /><path d="M5 17l4.5-4.5 3 3 2.5-2.5L20 17" /></I>;
export const IcoCamera = () => (<I><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.3l1.1-1.6A1.5 1.5 0 0 1 10.1 4h3.8a1.5 1.5 0 0 1 1.2.4L16.2 6h1.3A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" fill="currentColor" fillOpacity=".16" /><circle cx="12" cy="12.5" r="3.4" /></I>);
export const IcoSparkle = () => (<I><path d="M10 4l1.6 4.4L16 10l-4.4 1.6L10 16l-1.6-4.4L4 10l4.4-1.6z" fill="currentColor" fillOpacity=".16" /><path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z" /></I>);
export const IcoSend = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5L21 3L13.5 21L11 13Z" fill="#fff" /></svg>);
export const IcoGoogle = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" /><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" /><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" /><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" /></svg>
);
export const IcoApple = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-1-2.4-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" /></svg>
);
