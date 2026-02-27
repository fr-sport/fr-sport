// === المفاتيح السحرية لـ Firebase ===
const firebaseConfig = {
    apiKey: "AIzaSyCEGxx2tlEsw09VJPWyL1Dd_-n6mziatuA",
    authDomain: "fr-sport.firebaseapp.com",
    projectId: "fr-sport",
    storageBucket: "fr-sport.firebasestorage.app",
    messagingSenderId: "247900578680",
    appId: "1:247900578680:web:03c1af6d0351737a19de8d",
    measurementId: "G-W1K6K94HDL"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const analytics = firebase.analytics();
console.log("تم الاتصال بقاعدة البيانات بنجاح");

// === سيرفر جلب المباريات ===
const SERVER_URL = "https://spring-dream-011d.farhad10180.workers.dev";
const TOP_LEAGUES = [2, 3, 39, 140, 135, 78, 61, 307, 1, 4, 17, 12];
let globalMatches = []; 

const svgIcons = {
    subIn: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00b853" stroke-width="4"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
    subOut: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" stroke-width="4"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,
    goal: `<span style="color:#00e676; font-size:10px; font-weight:bold;">[هدف]</span>`, 
    yellowCard: `<span style="color:#ffeb3b; font-size:10px; font-weight:bold;">[إنذار]</span>`, 
    redCard: `<span style="color:#f44336; font-size:10px; font-weight:bold;">[طرد]</span>`,
    stadium: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>`
};

function setupDatesBar() {
    const container = document.getElementById('dates-container');
    if (!container) return;
    container.innerHTML = '';
    const today = new Date();
    const daysNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    for (let i = -10; i <= 10; i++) {
        let d = new Date(); d.setDate(today.getDate() + i); let dateStr = d.toISOString().split('T')[0];
        let label = i === 0 ? "اليوم" : i === -1 ? "أمس" : i === 1 ? "غداً" : `${daysNames[d.getDay()]} ${d.getDate()}`;
        let activeClass = i === 0 ? "active" : "";
        container.innerHTML += `<div class="date-item ${activeClass}" id="btn-${dateStr}" onclick="selectDate('${dateStr}')">${label}</div>`;
    }
    setTimeout(() => { document.querySelector('.date-item.active')?.scrollIntoView({ behavior: 'smooth', inline: 'center' }); }, 100);
}

function selectDate(dateStr) {
    document.querySelectorAll('.page-content').forEach(page => page.classList.add('hidden'));
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById('tab-matches').classList.remove('hidden');
    document.querySelectorAll('.bottom-nav .nav-item')[0].classList.add('active'); 
    document.querySelectorAll('.date-item').forEach(item => item.classList.remove('active'));
    const clickedBtn = document.getElementById(`btn-${dateStr}`);
    if (clickedBtn) { clickedBtn.classList.add('active'); clickedBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }
    fetchFotMobStyle(dateStr);
}

function switchTab(element, tabId) {
    document.querySelectorAll('.page-content').forEach(page => page.classList.add('hidden'));
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
    if(document.getElementById(tabId)) document.getElementById(tabId).classList.remove('hidden'); 
    element.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleLive(element) {
    element.classList.toggle('active');
    const container = document.getElementById('tab-matches');
    if (element.classList.contains('active')) {
        container.classList.add('live-mode');
    } else {
        container.classList.remove('live-mode');
    }
}

window.addEventListener('hashchange', function() {
    if (window.location.hash !== '#open') {
        const teamModal = document.getElementById('team-modal');
        const matchModal = document.getElementById('match-modal');
        if (teamModal && !teamModal.classList.contains('hidden')) { closeModalAnim('team-modal'); } 
        if (matchModal && !matchModal.classList.contains('hidden')) { closeModalAnim('match-modal'); }
    }
});

function closeModal(id) {
    if(window.location.hash === '#open') { history.back(); } else { closeModalAnim(id); }
}

function closeModalAnim(id) {
    const modal = document.getElementById(id);
    if(!modal || modal.classList.contains('hidden')) return;
    if(id === 'match-modal') { modal.style.animation = 'slideDownModal 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'; } 
    else { modal.querySelector('.modal-content').style.animation = 'popOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'; modal.style.animation = 'fadeOut 0.3s ease forwards'; }
    setTimeout(() => {
        modal.classList.add('hidden'); modal.style.animation = '';
        if(modal.querySelector('.modal-content')) modal.querySelector('.modal-content').style.animation = '';
    }, 280);
}

// === CSS التشكيلات والملعب المُطور ===
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes slideDownModal { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(100%); } }
    @keyframes popOut { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.8); } }
    @keyframes fadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }
    
    .pitch-container { width: 100%; aspect-ratio: 2/3; background: linear-gradient(180deg, #2e7d32 0%, #388e3c 50%, #2e7d32 100%); border: 3px solid rgba(255,255,255,0.6); position: relative; margin: 25px 0; overflow: hidden; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.6); display: flex; flex-direction: column; }
    .pitch-container::before { content: ''; position: absolute; top: 50%; left: 0; width: 100%; height: 3px; background: rgba(255,255,255,0.5); transform: translateY(-50%); }
    .pitch-container::after { content: ''; position: absolute; top: 50%; left: 50%; width: 22%; padding-bottom: 22%; border: 3px solid rgba(255,255,255,0.5); border-radius: 50%; transform: translate(-50%, -50%); }
    .penalty-box-top { position: absolute; top: 0; left: 22%; width: 56%; height: 16%; border: 3px solid rgba(255,255,255,0.5); border-top: none; }
    .penalty-box-bottom { position: absolute; bottom: 0; left: 22%; width: 56%; height: 16%; border: 3px solid rgba(255,255,255,0.5); border-bottom: none; }
    
    .team-half { flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; padding: 10px 0; position: relative; z-index: 5;}
    .home-half { flex-direction: column-reverse; }
    .pitch-row { display: flex; justify-content: space-evenly; align-items: center; width: 100%; }
    
    .pitch-player-box { display: flex; flex-direction: column; align-items: center; position: relative; width: 20%; }
    .pitch-player-img { width: 42px; height: 42px; border-radius: 50%; border: 2px solid #fff; background: #eee; object-fit: cover; box-shadow: 0 3px 8px rgba(0,0,0,0.5); z-index: 2; transition: transform 0.2s;}
    .pitch-player-box:active .pitch-player-img { transform: scale(0.95); }
    .player-num-pitch { position: absolute; top: -6px; right: 50%; transform: translateX(28px); background: var(--accent-color); color: #000; font-weight: 900; font-size: 11px; width: 18px; height: 18px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2px solid #fff; z-index: 3; box-shadow: 0 2px 4px rgba(0,0,0,0.3);}
    .player-name-pitch { background: rgba(0,0,0,0.75); color: #fff; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 10px; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70px; text-align: center; backdrop-filter: blur(2px); z-index: 1;}
    
    .lineups-container { margin-top: 15px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 15px; padding: 15px; }
    .lineups-header { text-align: center; color: var(--accent-color); font-weight: 900; margin-bottom: 12px; font-size: 17px; text-shadow: var(--accent-glow); letter-spacing: 0.5px;}
    .lineups-formations { display: flex; justify-content: center; gap: 15px; font-size: 13px; color: #fff; margin-bottom: 15px; padding: 5px; font-weight:bold; background: rgba(0,0,0,0.2); border-radius: 20px; width: fit-content; margin-left: auto; margin-right: auto;}
    .formation-badge { background: var(--accent-color); color: #000; padding: 2px 8px; border-radius: 8px; }
    .lineup-row { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 10px 0; }
    .lineup-row:last-child { border-bottom: none; }
    .lineup-player { display: flex; align-items: center; gap: 10px; width: 48%; font-size: 12px; color: #fff; overflow: hidden; }
    .home-player { justify-content: flex-start; }
    .away-player { justify-content: flex-end; flex-direction: row-reverse; text-align: right; }
    .player-num { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color: var(--accent-color); width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-size: 11px; font-weight: bold; flex-shrink: 0;}
    .player-name { text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
`;
document.head.appendChild(styleSheet);

async function showTeamInfo(event, teamId) {
    if(event) event.stopPropagation(); 
    if(window.location.hash !== '#open') { window.location.hash = 'open'; }

    const modal = document.getElementById('team-modal'); 
    const container = document.getElementById('team-info-container');
    modal.classList.remove('hidden'); 
    container.innerHTML = '<div class="loader-container"><div class="spinner"></div></div>';
    try {
        const response = await fetch(`${SERVER_URL}/teams?id=${teamId}`);
        const data = await response.json();
        if (data.response && data.response.length > 0) {
            const team = data.response[0].team, venue = data.response[0].venue;
            container.innerHTML = `
                <div class="team-profile-hero">
                    <img src="${team.logo}" class="team-profile-logo">
                    <h2 class="team-profile-name" dir="ltr">${team.name}</h2>
                </div>
                <div class="team-stats-grid">
                    <div class="stat-box"><span class="stat-label">البلد</span><span class="stat-value">${team.country || '-'}</span></div>
                    <div class="stat-box"><span class="stat-label">التأسيس</span><span class="stat-value" dir="ltr">${team.founded || '-'}</span></div>
                    <div class="stat-box"><span class="stat-label">المدينة</span><span class="stat-value">${venue.city || '-'}</span></div>
                    <div class="stat-box"><span class="stat-label">الكود</span><span class="stat-value" dir="ltr">${team.code || '-'}</span></div>
                </div>
                <div class="team-stadium-card">
                    <div class="stadium-icon">${svgIcons.stadium}</div>
                    <div class="stadium-info">
                        <span class="stadium-name" dir="ltr">${venue.name || 'غير متوفر'}</span>
                        <span class="stadium-capacity">السعة: ${venue.capacity?.toLocaleString() || 'غير معروف'} متفرج</span>
                    </div>
                </div>`;
        }
    } catch { container.innerHTML = '<p class="empty-msg" style="color:#ff3b30;">حدث خطأ في جلب البيانات</p>'; }
}

function buildPitchHTML(lineup, isHome) {
    if (!lineup || !lineup.startXI) return '';
    
    let lines = { GK: [], DEF: [], MID: [], FWD: [] };
    lineup.startXI.forEach(item => {
        let pos = item.player.pos;
        if (pos === 'G') lines.GK.push(item);
        else if (pos === 'D') lines.DEF.push(item);
        else if (pos === 'M') lines.MID.push(item);
        else if (pos === 'F') lines.FWD.push(item);
    });

    const sortPlayers = (arr) => arr.sort((a,b) => {
        let cA = a.player.grid ? Number(a.player.grid.split(':')[1]) : 0;
        let cB = b.player.grid ? Number(b.player.grid.split(':')[1]) : 0;
        return cA - cB;
    });
    
    let html = '';
    const buildRow = (players) => {
        sortPlayers(players);
        let rowHTML = '<div class="pitch-row">';
        players.forEach(item => {
            let p = item.player;
            let imgUrl = `https://media.api-sports.io/football/players/${p.id}.png`;
            let shortName = p.name.split(' ').pop();
            rowHTML += `
                <div class="pitch-player-box">
                    <img src="${imgUrl}" class="pitch-player-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'">
                    <div class="player-num-pitch">${p.number || '-'}</div>
                    <div class="player-name-pitch" dir="ltr">${shortName}</div>
                </div>`;
        });
        rowHTML += '</div>';
        return rowHTML;
    }

    if (isHome) {
        html += buildRow(lines.GK); html += buildRow(lines.DEF); html += buildRow(lines.MID); html += buildRow(lines.FWD);
    } else {
        html += buildRow(lines.FWD); html += buildRow(lines.MID); html += buildRow(lines.DEF); html += buildRow(lines.GK);
    }
    return html;
}

async function openMatchDetails(fixtureId) {
    if(window.location.hash !== '#open') { window.location.hash = 'open'; }

    const modal = document.getElementById('match-modal'); 
    const container = document.getElementById('match-info-container');
    modal.classList.remove('hidden'); 
    container.innerHTML = '<div class="loader-container"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(`${SERVER_URL}/fixtures?id=${fixtureId}`);
        const data = await response.json(); 
        const m = data.response[0];
        if(!m) return;

        let eventsHTML = '<div class="timeline-container">';
        if(m.events && m.events.length > 0) {
            m.events.forEach(ev => {
                const isHome = ev.team.id === m.teams.home.id;
                const playerImg = `https://media.api-sports.io/football/players/${ev.player.id}.png`;
                let eventBody = `<span class="event-pname">${ev.player.name}</span>`;
                let icon = '';

                if (ev.type === 'Goal') { icon = svgIcons.goal; if(ev.assist.name) eventBody += `<span class="assist-text">بمساعدة: ${ev.assist.name}</span>`; } 
                else if (ev.type === 'Card') { icon = ev.detail.includes('Yellow') ? svgIcons.yellowCard : svgIcons.redCard; } 
                else if (ev.type === 'subst') {
                    eventBody = `<div style="display:flex; flex-direction:column; gap:2px;"><div style="display:flex; align-items:center; gap:4px;">${ev.player.name} ${svgIcons.subIn}</div><div style="font-size:9px; color:gray; display:flex; align-items:center; gap:4px;">${ev.assist.name} ${svgIcons.subOut}</div></div>`;
                }

                eventsHTML += `
                    <div class="event-row">
                        <div class="event-side event-home">${isHome ? `<div class="event-player">${eventBody}</div><img src="${playerImg}" class="event-avatar" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'"> ${icon}` : ''}</div>
                        <div class="event-time">'${ev.time.elapsed}</div>
                        <div class="event-side event-away">${!isHome ? `${icon} <img src="${playerImg}" class="event-avatar" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'"><div class="event-player">${eventBody}</div>` : ''}</div>
                    </div>`;
            });
        } else { eventsHTML += '<p class="empty-msg">لا توجد أحداث مسجلة بعد.</p>'; }
        eventsHTML += '</div>';

        let pitchAreaHTML = '';
        let subsHTML = '';
        if (m.lineups && m.lineups.length > 0) {
            const hLineup = m.lineups[0];
            const aLineup = m.lineups.length > 1 ? m.lineups[1] : null;
            
            pitchAreaHTML = `
            <div class="lineups-header" style="margin-top:25px;">التشكيلة الأساسية</div>
            <div class="lineups-formations">
                <span class="formation-badge" dir="ltr">${hLineup.formation || '-'}</span>
                <span>الخطة</span>
                <span class="formation-badge" dir="ltr">${aLineup ? (aLineup.formation || '-') : '-'}</span>
            </div>
            <div class="pitch-container">
                <div class="penalty-box-top"></div>
                <div class="penalty-box-bottom"></div>
                <div class="team-half away-half">${aLineup ? buildPitchHTML(aLineup, false) : ''}</div>
                <div class="team-half home-half">${buildPitchHTML(hLineup, true)}</div>
            </div>`;
            
            subsHTML = `<div class="lineups-container"><div class="lineups-header">قائمة البدلاء</div><div class="lineups-grid">`;
            let maxSubs = Math.max(hLineup.substitutes?.length || 0, aLineup?.substitutes?.length || 0);
            for(let i=0; i<maxSubs; i++) {
                const hSub = hLineup.substitutes && hLineup.substitutes[i] ? hLineup.substitutes[i].player : null;
                const aSub = (aLineup && aLineup.substitutes && aLineup.substitutes[i]) ? aLineup.substitutes[i].player : null;
                if(!hSub && !aSub) break;
                subsHTML += `
                    <div class="lineup-row">
                        <div class="lineup-player home-player"><span class="player-num">${hSub?.number || '-'}</span><span class="player-name">${hSub?.name || '-'}</span></div>
                        <div class="lineup-player away-player"><span class="player-num">${aSub?.number || '-'}</span><span class="player-name">${aSub?.name || '-'}</span></div>
                    </div>`;
            }
            subsHTML += `</div></div>`;
        } else {
            pitchAreaHTML = '<p class="empty-msg">التشكيلة غير متوفرة لهذه المباراة حالياً</p>';
        }

        container.innerHTML = `
            <div class="match-hero">
                <div style="text-align:center; cursor:pointer;" onclick="showTeamInfo(event, ${m.teams.home.id})"><img src="${m.teams.home.logo}" width="60"><br><span class="hero-team-name">${m.teams.home.name}</span></div>
                <div style="text-align:center"><div style="font-size:38px; font-weight:900; color:var(--accent-color); text-shadow:var(--accent-glow);" dir="ltr">${m.goals.home ?? '-'} - ${m.goals.away ?? '-'}</div><div style="background:var(--accent-color); color:#000; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:bold;">${m.fixture.status.long}</div></div>
                <div style="text-align:center; cursor:pointer;" onclick="showTeamInfo(event, ${m.teams.away.id})"><img src="${m.teams.away.logo}" width="60"><br><span class="hero-team-name">${m.teams.away.name}</span></div>
            </div>
            ${eventsHTML}
            ${pitchAreaHTML}
            ${subsHTML}
        `;
    } catch (e) { container.innerHTML = '<p class="empty-msg">خطأ في جلب تفاصيل المباراة</p>'; }
}

async function fetchFotMobStyle(selectedDate = null) {
    const targetDate = selectedDate || new Date().toISOString().split('T')[0];
    const container = document.getElementById('tab-matches');
    const liveBtn = document.querySelector('.live-btn');
    if (liveBtn) liveBtn.classList.remove('active');
    container.classList.remove('live-mode');
    container.innerHTML = '<div class="loader-container"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(`${SERVER_URL}/fixtures?date=${targetDate}`);
        const data = await response.json();
        if (data.errors && data.errors.requests) { container.innerHTML = `<div class="empty-msg" style="color:#ff3b30;">انتهت الباقة. تأكد من مفتاح التطبيق.</div>`; return; }
        globalMatches = data.response || []; renderMatchesUI(); 
    } catch (error) { container.innerHTML = "<p class='empty-msg'>حدث خطأ بالاتصال بالسيرفر</p>"; }
}

function isLiveMatch(status) { return ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(status); }

function renderMatchesUI() {
    const container = document.getElementById('tab-matches');
    if (!globalMatches || globalMatches.length === 0) { container.innerHTML = "<p class='empty-msg'>لا توجد مباريات في هذا التاريخ</p>"; return; }

    const leaguesGroup = {};
    globalMatches.forEach(m => {
        if (!leaguesGroup[m.league.name]) leaguesGroup[m.league.name] = { info: m.league, games: [], hasLive: false };
        leaguesGroup[m.league.name].games.push(m);
        if (isLiveMatch(m.fixture.status.short)) leaguesGroup[m.league.name].hasLive = true;
    });

    const sortedLeagues = Object.values(leaguesGroup).sort((a, b) => {
        if (a.hasLive && !b.hasLive) return -1;
        if (!a.hasLive && b.hasLive) return 1;
        const aTop = TOP_LEAGUES.includes(a.info.id) ? TOP_LEAGUES.indexOf(a.info.id) : 999;
        const bTop = TOP_LEAGUES.includes(b.info.id) ? TOP_LEAGUES.indexOf(b.info.id) : 999;
        return aTop - bTop;
    });

    container.innerHTML = `<div id="no-live-msg">لا توجد مباريات مباشرة حالياً</div>`; 

    sortedLeagues.forEach(group => {
        const league = group.info;
        group.games.sort((a, b) => {
            const aLive = isLiveMatch(a.fixture.status.short) ? -1 : 1;
            const bLive = isLiveMatch(b.fixture.status.short) ? -1 : 1;
            if (aLive !== bLive) return aLive - bLive; 
            return new Date(a.fixture.date) - new Date(b.fixture.date); 
        });

        let leagueClass = group.hasLive ? 'has-live-match' : 'no-live-match';
        let leagueHTML = `<div class="league-group ${leagueClass}"><div class="league-header"><div class="league-title-wrapper"><img src="${league.logo}" class="league-logo"><span class="league-name">${league.name}</span></div></div>`;

        group.games.forEach(m => {
            const s = m.fixture.status.short;
            const isLive = isLiveMatch(s);
            const isNotStarted = ['NS', 'TBD'].includes(s);
            let matchClass = isLive ? 'is-live-match' : 'not-live-match';
            let centerText = ''; let rightStatus = '';
            
            if (isNotStarted) {
                const timeStr = new Date(m.fixture.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                centerText = `<div class="match-score" dir="ltr">${timeStr}</div>`; rightStatus = `<span class="status-plain">-</span>`; 
            } else if (isLive) {
                centerText = `<div class="match-score score-live" dir="ltr">${m.goals.home} - ${m.goals.away}</div>`; rightStatus = `<div class="status-live-circle">${m.fixture.status.elapsed}'</div>`; 
            } else {
                centerText = `<div class="match-score" dir="ltr">${m.goals.home ?? '-'} - ${m.goals.away ?? '-'}</div>`; rightStatus = `<span class="status-plain">${['FT', 'AET', 'PEN'].includes(s) ? 'FT' : s}</span>`; 
            }

            leagueHTML += `
                <div class="match-row ${matchClass}" onclick="openMatchDetails(${m.fixture.id})">
                    <div class="teams-and-score">
                        <div class="team-side team-home" onclick="showTeamInfo(event, ${m.teams.home.id})"><span class="team-name">${m.teams.home.name}</span><img src="${m.teams.home.logo}" class="team-logo"></div>
                        <div>${centerText}</div>
                        <div class="team-side team-away" onclick="showTeamInfo(event, ${m.teams.away.id})"><img src="${m.teams.away.logo}" class="team-logo"><span class="team-name">${m.teams.away.name}</span></div>
                    </div>
                    <div class="match-status-right" dir="ltr">${rightStatus}</div>
                </div>`;
        });
        leagueHTML += `</div>`; container.innerHTML += leagueHTML;
    });
}

function filterMatches() {
    const query = document.getElementById('match-search').value.toLowerCase();
    document.querySelectorAll('.match-row').forEach(row => { row.classList.toggle('hidden-by-search', !row.innerText.toLowerCase().includes(query)); });
    document.querySelectorAll('.league-group').forEach(group => {
        const hasVisible = Array.from(group.querySelectorAll('.match-row')).some(m => !m.classList.contains('hidden-by-search'));
        group.classList.toggle('hidden-by-search', !hasVisible);
    });
}

setupDatesBar(); fetchFotMobStyle();
