import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './state.jsx';
import { LangPick, Login } from './screens/Welcome.jsx';
import { Library, perfText } from './screens/Library.jsx';
import { Studio } from './screens/Studio.jsx';
import { Contest } from './screens/Contest.jsx';
import { Shop, PackOpening } from './screens/Shop.jsx';
import { Profile } from './screens/Profile.jsx';
import { TabBar, Toast, AlertHost } from './components/ui.jsx';
import { stats } from './lib/fxEngine.js';

/* Compteur de fluidité (5 appuis rapides sur « Bonjour, … ») : images réellement affichées par seconde. */
function Perf() {
  const [txt, setTxt] = useState('');
  useEffect(() => {
    let d0 = stats().drawn, t1 = performance.now();
    const id = setInterval(() => { const s = stats(), n = performance.now(), got = Math.round((s.drawn - d0) * 1000 / (n - t1)); d0 = s.drawn; t1 = n; setTxt(perfText({ ...s, got })); }, 1000);
    return () => clearInterval(id);
  }, []);
  return <div className="perf" id="perf">{txt}</div>;
}

function Shell() {
  const { phase, tab, studio, theme } = useApp();
  const [perf, setPerf] = useState(false);
  return (
    <div className={'app' + (studio ? ' studio-on' : '')} key={theme} data-theme-applied={theme}>   {/* reconstruit au changement de thème : Safari redessine tout */}
      <div className="bg" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="status-strip" aria-hidden="true" />
      {phase === 'lang' && <LangPick />}
      {phase === 'login' && <Login />}
      {phase === 'app' && <>
        {!studio && tab === 'library' && <Library onPerf={() => setPerf(p => !p)} />}
        {!studio && tab === 'contest' && <Contest />}
        {!studio && tab === 'shop' && <Shop />}
        {!studio && tab === 'profile' && <Profile />}
        {!studio && <TabBar />}
        {studio && <Studio key={studio.id + ':' + (studio.intro ? 'i' : '')} />}
        <PackOpening />
      </>}
      {perf && <Perf />}
      <Toast />
      <AlertHost />
    </div>
  );
}

export default function App() {
  return <AppProvider><Shell /></AppProvider>;
}
