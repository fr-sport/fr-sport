const firebaseConfig = {
    apiKey: "AIzaSyCEGxx2tlEsw09VJPWyL1Dd_-n6mziatuA",
    authDomain: "fr-sport.firebaseapp.com",
    projectId: "fr-sport",
    storageBucket: "fr-sport.firebasestorage.app",
    messagingSenderId: "247900578680",
    appId: "1:247900578680:web:03c1af6d0351737a19de8d",
    measurementId: "G-W1K6K94HDL"
};
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();

const SERVER_URL = "https://spring-dream-011d.farhad10180.workers.dev";
const TOP_LEAGUES = [2, 3, 39, 140, 135, 78, 61, 307, 1, 4, 17, 12];
let globalMatches = []; 

// الأيقونات الجديدة الاحترافية بدلاً من الكلمات النصية
const svgIcons = {
    subIn: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e676" stroke-width="3"><polyline points="13 17 18 12 13 7"></polyline><line x1="6" y1="12" x2="18" y2="12"></line></svg>`,
    subOut: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" stroke-width="3"><polyline points="11 17 6 12 11 7"></polyline><line x1="18" y1="12" x2="6" y2="12"></line></svg>`,
    goal: `<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="#111" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 6l-2 3h4zM8 11l-3 3 2 3h1.5l2-3zM16 11l3 3-2 3h-1.5l-2-3zM10.5 15h3l-1.5 3z"></path></svg>`,
    yellowCard: `<svg width="10" height="14" viewBox="0 0 24 24" fill="#ffeb3b" stroke="#fbc02d" stroke-width="1"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect></svg>`,
    redCard: `<svg width="10" height="14" viewBox="0 0 24 24" fill="#f44336" stroke="#d32f2f" stroke-width="1"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect></svg>`,
    stadium: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>`
};

// صورة افتراضية عند فقدان صورة اللاعب من السيرفر
const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .pitch-container { width: 100%; aspect-ratio: 2/3; background: linear-gradient(180deg, #2e7d32 0%, #388e3c 50%, #2e7d32 100%); border: 3px solid rgba(255,255,255,0.6); position: relative; margin: 25px 0; overflow: hidden; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.6); display: flex; flex-direction: column; }
    .pitch-container::before { content: ''; position: absolute; top: 50%; left: 0; width: 100%; height: 3px; background: rgba(255,255,255,0.5); transform: translateY(-50%); }
    .pitch-container::after { content: ''; position: absolute; top: 50%; left: 50%; width: 22%; padding-bottom: 22%; border: 3px solid rgba(255,255,255,0.5); border-radius: 50%; transform: translate(-50%, -50%); }
    .penalty-box-top { position: absolute; top: 0; left: 22%; width: 56%; height: 16%; border: 3px solid rgba(255,255,255,0.5); border-top: none; }
    .penalty-box-bottom { position: absolute; bottom: 0; left: 22%; width: 56%; height: 16%; border: 3px solid rgba(255,255,255,0.5); border-bottom: none; }
    .team-half { flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; padding: 10px 0; position: relative; z-index: 5;}
    .home-half { flex-direction: column-reverse; }
    .pitch-row { display: flex; justify-content: space-evenly; align-items: center; width: 100%; }
    .pitch-player-box { display: flex; flex-direction: column; align-items: center; position: relative; width: 20%; }
    .pitch-player-img { width: 42px; height: 42px; border-radius: 50%; border: 2px solid #fff; background: #222; object-fit: cover; box-shadow: 0 3px 8px rgba(0,0,0,0.5); }
    .player-num-pitch { position: absolute; top: -6px; right: 50%; transform: translateX(28px); background: #cccccc; color: #000; font-weight: 900; font-size: 11px; width: 18px; height: 18px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid #fff; z-index: 3;}
    .player-name-pitch { background: rgba(0,0,0,0.75); color: #fff; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 10px; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70px; text-align: center; }
    .lineups-container { margin-top: 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(204,204,204,0.2); border-radius: 15px; padding: 15px; }
    .lineups-header { text-align: center; color: #cccccc; font-weight: 900; margin-bottom: 12px; font-size: 17px; text-shadow: 0 0 15px rgba(204,204,204,0.3);}
    .lineups-formations { display: flex; justify-content: center; gap: 15px; font-size: 13px; color: #fff; margin-bottom: 15px; padding: 5px; font-weight:bold; background: rgba(0,0,0,0.2); border-radius: 20px; width: fit-content; margin-left: auto; margin-right: auto;}
    .formation-badge { background: #cccccc; color: #000; padding: 2px 8px; border-radius: 8px; }
    .lineup-row { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 10px 0; }
    .lineup-player { display: flex; align-items: center; gap: 10px; width: 48%; font-size: 12px; color: #fff; overflow: hidden; }
    .home-player { justify-content: flex-start; } .away-player { justify-content: flex-end; flex-direction: row-reverse; text-align: right; }
