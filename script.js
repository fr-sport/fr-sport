const CONFIG = {
    API_URL: "https://spring-dream-011d.farhad10180.workers.dev",
    LIVE_STATUSES: ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'PEN'],
    NOT_STARTED_STATUSES: ['NS', 'TBD']
};

const AppState = { matchesCache: {}, globalMatches: [], isLiveMode: false, currentDate: '' };

const Utils = {
    formatDateEn: (dateObj, offset) => {
        if (offset === 0) return "Today";
        if (offset === -1) return "Yesterday";
        if (offset === 1) return "Tomorrow";
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${days[dateObj.getDay()]} ${dateObj.getDate().toString().padStart(2, '0')} ${months[dateObj.getMonth()]}`;
    },
    isLiveMatch: (s) => CONFIG.LIVE_STATUSES.includes(s),
    isNotStarted: (s) => CONFIG.NOT_STARTED_STATUSES.includes(s)
};

function setupDatesBar() {
    const container = document.getElementById('dates-container');
    if (!container) return;
    let html = '';
    const today = new Date();
    for (let i = -7; i <= 7; i++) {
        let d = new Date(); d.setDate(today.getDate() + i);
        let dateStr = d.toISOString().split('T')[0];
        let label = Utils.formatDateEn(d, i);
        let active = i === 0 ? "active" : "";
        html += `<div class="date-item ${active}" id="btn-${dateStr}" onclick="selectDate('${dateStr}')">${label}</div>`;
    }
    container.innerHTML = html;
    setTimeout(() => { document.querySelector('.date-item.active')?.scrollIntoView({ behavior: 'smooth', inline: 'center' }); }, 100);
}

function selectDate(dateStr) {
    if (AppState.currentDate === dateStr) return;
    document.querySelectorAll('.date-item').forEach(el => el.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${dateStr}`);
    if(activeBtn) { activeBtn.classList.add('active'); activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center' }); }
    
    const matchesTabBtn = document.querySelector('.nav-item:nth-child(1)');
    if(matchesTabBtn) switchTab(matchesTabBtn);

    fetchMatches(dateStr);
}

function switchTab(el) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    el.classList.add('active');
    
    document.getElementById('tab-matches').classList.add('hidden');
    const newsTab = document.getElementById('tab-news');
    if(newsTab) newsTab.classList.add('hidden');
    
    const tabName = el.innerText.trim();
    const datesWrapper = document.querySelector('.dates-wrapper');
    
    if(tabName === 'Matches') {
        document.getElementById('tab-matches').classList.remove('hidden');
        if(datesWrapper) datesWrapper.style.display = 'block'; 
    } else if(tabName === 'News') {
        if(newsTab) newsTab.classList.remove('hidden');
        if(datesWrapper) datesWrapper.style.display = 'none'; 
        if(newsTab && (newsTab.innerHTML.includes('Click') || newsTab.innerHTML.trim() === '')) {
            fetchNews();
        }
    } else {
        if(datesWrapper) datesWrapper.style.display = 'none';
    }
}

function toggleLive(btn) {
    btn.classList.toggle('active');
    AppState.isLiveMode = btn.classList.contains('active');
    renderMatchesList(AppState.globalMatches);
}

// نظام الأخبار الجديد المضاد للحظر (Anti-Ban News Fetcher)
async function fetchNews() {
    const container = document.getElementById('tab-news');
    if(!container) return;
    container.innerHTML = '<div class="loader" style="color:var(--accent-color);">Loading latest news...</div>';
    
    try {
        const rssUrl = 'http://feeds.bbci.co.uk/sport/football/rss.xml';
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
        const res = await fetch(proxyUrl);
        
        if(!res.ok) throw new Error("API Error");
        const xmlText = await res.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const items = Array.from(xmlDoc.querySelectorAll("item"));

        if(items.length === 0) throw new Error("No news found");

        let html = `
        <div class="news-top-nav">
            <div class="news-top-tab active" onclick="switchNewsSubTab('foryou')">For You</div>
            <div class="news-top-tab" onclick="switchNewsSubTab('transfers')">Transfers</div>
        </div>
        <div id="news-foryou-content">
            <div class="trending-header"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg> Trending Now</div>
            <div class="news-feed">`;

        items.slice(0, 15).forEach((item, index) => {
            let title = item.querySelector("title")?.textContent || "News";
            let link = item.querySelector("link")?.textContent || "#";
            let img = item.querySelector("thumbnail")?.getAttribute("url") || 'https://via.placeholder.com/400x200/151515/c5934b?text=FR+SPORT';

            if (index === 0) {
                html += `<div class="news-hero-card" onclick="window.open('${link}', '_blank')"><img src="${img}" class="news-hero-img"><div class="news-hero-title">${title}</div><div class="news-date">BBC Sport</div></div>`;
            } else {
                html += `<div class="news-list-card" onclick="window.open('${link}', '_blank')"><div class="news-list-content"><div class="news-list-title">${title}</div><div class="news-date">BBC Sport</div></div><img src="${img}" class="news-list-img"></div>`;
            }
        });
        html += `</div></div>`;

        // قسم الانتقالات
        const transfers = [
            { name: "Kylian Mbappé", fee: "Free Transfer", fromLogo: "https://media.api-sports.io/football/teams/85.png", toLogo: "https://media.api-sports.io/football/teams/541.png", img: "https://media.api-sports.io/football/players/278.png" },
            { name: "Julián Álvarez", fee: "€75M", fromLogo: "https://media.api-sports.io/football/teams/50.png", toLogo: "https://media.api-sports.io/football/teams/530.png", img: "https://media.api-sports.io/football/players/9089.png" },
            { name: "Leny Yoro", fee: "€62M", fromLogo: "https://media.api-sports.io/football/teams/79.png", toLogo: "https://media.api-sports.io/football/teams/33.png", img: "https://media.api-sports.io/football/players/335804.png" }
        ];

        html += `<div id="news-transfers-content" class="hidden"><div class="news-feed" style="padding-top:20px;">`;
        transfers.forEach(t => {
            html += `<div class="transfer-card"><img src="${t.img}" class="transfer-player-img"><div class="transfer-info"><div class="transfer-name">${t.name}</div><div class="transfer-fee">${t.fee}</div><div class="transfer-clubs"><img src="${t.fromLogo}" class="transfer-club-logo"><div class="transfer-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></div><img src="${t.toLogo}" class="transfer-club-logo"></div></div></div>`;
        });
        html += `</div></div>`;
        container.innerHTML = html;

    } catch (e) {
        container.innerHTML = `<div class="empty-msg" style="margin-top:50px;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2" style="margin-bottom:15px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><br>
            News server is busy.<br>Please try again in a few minutes.
        </div>`;
    }
}

function switchNewsSubTab(tabId) {
    document.querySelectorAll('.news-top-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('news-foryou-content').classList.add('hidden');
    document.getElementById('news-transfers-content').classList.add('hidden');
    document.getElementById(`news-${tabId}-content`).classList.remove('hidden');
}

function getLeaguePriority(league) {
    const top = ['england', 'spain', 'germany', 'italy', 'france'];
    if (league.id === 2 || league.id === 3 || league.id === 39) return 1;
    if (top.includes(league.country?.toLowerCase())) return 2;
    return 3;
}

// نظام جلب المباريات المضاد للانهيار
async function fetchMatches(date) {
    AppState.currentDate = date;
    const container = document.getElementById('tab-matches');
    if (!container) return;
    if (AppState.matchesCache[date]) { AppState.globalMatches = AppState.matchesCache[date]; renderMatchesList(AppState.globalMatches); return; }
    
    container.innerHTML = '<div class="loader" style="color:var(--accent-color); margin-top:50px;">Fetching matches...</div>';
    
    try {
        const res = await fetch(`${CONFIG.API_URL}/fixtures?date=${date}`);
        if (!res.ok) throw new Error("Server error");
        const data = await res.json();
        const matches = data.response || [];
        AppState.matchesCache[date] = matches; 
        AppState.globalMatches = matches;
        renderMatchesList(matches);
    } catch (error) { 
        container.innerHTML = `<div class="empty-msg" style="margin-top:50px;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="margin-bottom:15px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><br>
            Unable to connect to the server.<br>Please check your internet or API Worker.
        </div>`; 
    }
}

function renderMatchesList(matches) {
    const container = document.getElementById('tab-matches');
    if (!matches || matches.length === 0) { container.innerHTML = '<div class="empty-msg" style="margin-top:50px;">No matches found for this day.</div>'; return; }
    
    const leaguesGroup = {};
    matches.forEach(m => {
        if (AppState.isLiveMode && !Utils.isLiveMatch(m.fixture.status.short)) return;
        if (!leaguesGroup[m.league.name]) { leaguesGroup[m.league.name] = { info: m.league, games: [] }; }
        leaguesGroup[m.league.name].games.push(m);
    });
    
    const sortedLeagues = Object.values(leaguesGroup).sort((a, b) => getLeaguePriority(a.info) - getLeaguePriority(b.info));
    if (sortedLeagues.length === 0) { container.innerHTML = '<div class="empty-msg" style="margin-top:50px;">No live matches right now.</div>'; return; }

    let html = '';
    sortedLeagues.forEach(group => {
        html += `<div class="league-group"><div class="league-header"><div class="league-title-wrapper"><img src="${group.info.logo}" class="league-logo"><span class="league-name">${group.info.country} - ${group.info.name}</span></div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg></div>`;
        group.games.forEach(m => {
            const s = m.fixture.status.short;
            let center = Utils.isNotStarted(s) ? `<div class="match-center">${new Date(m.fixture.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>` : Utils.isLiveMatch(s) ? `<div class="match-center live"><span style="font-size:10px;">${m.fixture.status.elapsed}'</span><br>${m.goals.home} - ${m.goals.away}</div>` : `<div class="match-center">${m.goals.home} - ${m.goals.away}</div>`;
            html += `<div class="match-row" onclick="openMatchDetails(${m.fixture.id})"><div class="match-teams-score"><span class="team-name home-name">${m.teams.home.name}</span><img src="${m.teams.home.logo}" class="team-logo">${center}<img src="${m.teams.away.logo}" class="team-logo"><span class="team-name away-name">${m.teams.away.name}</span></div></div>`;
        });
        html += `</div>`;
    });
    container.innerHTML = html;
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function switchModalTab(tab) { document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.add('hidden')); event.target.classList.add('active'); document.getElementById(`modal-${tab}`).classList.remove('hidden'); }

// رسم الملعب
function buildPitchHtml(teamLineup, teamInfo) {
    if (!teamLineup?.startXI?.length) return '';
    let html = `<div class="pitch-wrapper"><div class="pitch-header"><div class="pitch-team"><img src="${teamInfo.logo}">${teamInfo.name}</div><div class="pitch-formation">${teamLineup.formation || ''}</div></div><div class="pitch">`;
    const rows = {};
    teamLineup.startXI.forEach(item => { let grid = item.player.grid?.split(':') || []; let r = parseInt(grid[0]||1); if(!rows[r]) rows[r]=[]; rows[r].push(item.player); });
    Object.keys(rows).sort().forEach(k => {
        html += `<div class="pitch-row">`;
        rows[k].sort((a,b)=> (parseInt(a.grid?.split(':')[1]||0) - parseInt(b.grid?.split(':')[1]||0))).forEach(p => {
            html += `<div class="pitch-player" onclick="openPlayerDetails(${p.id})"><div class="pitch-player-img-wrapper"><img src="https://media.api-sports.io/football/players/${p.id}.png" class="pitch-player-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23555\\' stroke-width=\\'2\\'><circle cx=\\'12\\' cy=\\'8\\' r=\\'4\\'/><path d=\\'M20 21a8 8 0 0 0-16 0\\'/></svg>';"><div class="pitch-player-num">${p.number||''}</div></div><div class="pitch-player-name">${p.name.split(' ').pop()}</div></div>`;
        });
        html += `</div>`;
    });
    return html + `</div></div>`;
}

function buildPlayerRow(hP, aP) {
    let hH = hP ? `<div class="player-side player-home" onclick="openPlayerDetails(${hP.id})"><span class="p-num">${hP.number||''}</span><img src="https://media.api-sports.io/football/players/${hP.id}.png" class="sub-player-img" onerror="this.style.display='none'"><span class="p-name">${hP.name||'-'}</span></div>` : '<div class="player-side player-home"></div>';
    let aH = aP ? `<div class="player-side player-away" onclick="openPlayerDetails(${aP.id})"><span class="p-name">${aP.name||'-'}</span><img src="https://media.api-sports.io/football/players/${aP.id}.png" class="sub-player-img" onerror="this.style.display='none'"><span class="p-num">${aP.number||''}</span></div>` : '<div class="player-side player-away"></div>';
    return `<div class="player-row">${hH}${aH}</div>`;
}

async function openMatchDetails(id) {
    const modal = document.getElementById('match-modal');
    const container = document.getElementById('match-info-container');
    modal.classList.remove('hidden');
    container.innerHTML = '<div class="loader" style="margin-top:50px;">Loading Match Details...</div>';
    try {
        const [mRes, iRes] = await Promise.all([fetch(`${CONFIG.API_URL}/fixtures?id=${id}`), fetch(`${CONFIG.API_URL}/injuries?fixture=${id}`)]);
        const mData = await mRes.json(); const iData = await iRes.json();
        renderMatchDetailsModal(mData.response?.[0], iData.response || [], container);
    } catch(e) { container.innerHTML = '<div class="empty-msg">Failed to load details.</div>'; }
}

function renderMatchDetailsModal(m, injuries, container) {
    if(!m) return;
    let s = m.fixture.status.short;
    let time = Utils.isNotStarted(s) ? new Date(m.fixture.date).toLocaleTimeString('en-US', {hour:'numeric',minute:'2-digit'}) : `${m.goals.home||0} - ${m.goals.away||0}`;
    let sub = Utils.isNotStarted(s) ? 'Scheduled' : Utils.isLiveMatch(s) ? `<span style="color:var(--accent-color)">${m.fixture.status.elapsed}'</span>` : 'FT';
    
    let html = `<div class="match-hero"><div class="hero-team"><img src="${m.teams.home.logo}"><span class="p-name">${m.teams.home.name}</span></div><div class="hero-score-time"><div class="hero-score">${time}</div><div class="hero-sub">${sub}</div></div><div class="hero-team"><img src="${m.teams.away.logo}"><span class="p-name">${m.teams.away.name}</span></div></div><div class="tabs-container"><div class="tab-btn" onclick="switchModalTab('stats')">Stats</div><div class="tab-btn active" onclick="switchModalTab('lineups')">Lineups</div></div>`;
    
    html += '<div id="modal-stats" class="modal-tab-content hidden">';
    if(m.statistics?.length>1) m.statistics[0].statistics.forEach((st, i) => { let hV=st.value||0; let aV=m.statistics[1].statistics[i].value||0; let t=parseInt(hV)+parseInt(aV); let hp=t>0?(parseInt(hV)/t)*100:50; let ap=t>0?(parseInt(aV)/t)*100:50; html += `<div class="stat-row"><div class="stat-header"><span>${hV}</span><span>${st.type}</span><span>${aV}</span></div><div class="stat-bar-container"><div class="stat-bar-home" style="width:${hp}%"></div><div class="stat-bar-away" style="width:${ap}%"></div></div></div>`; });
    html += '</div><div id="modal-lineups" class="modal-tab-content">';
    if(m.lineups?.length>1) {
        html += buildPitchHtml(m.lineups[0], m.teams.home) + buildPitchHtml(m.lineups[1], m.teams.away) + `<div class="lineup-section"><div class="section-title">Substitutes</div>`;
        let max = Math.max(m.lineups[0].substitutes.length, m.lineups[1].substitutes.length);
        for(let i=0; i<max; i++) html += buildPlayerRow(m.lineups[0].substitutes[i]?.player, m.lineups[1].substitutes[i]?.player);
        html += '</div>';
    } else { html += `<div class="empty-msg">Lineups not available yet.</div>`; }
    container.innerHTML = html + '</div>';
}

async function openPlayerDetails(id) {
    if(!id) return;
    document.getElementById('player-modal').classList.remove('hidden');
    const c = document.getElementById('player-info-container');
    c.innerHTML = '<div class="loader" style="margin-top:50px;">Loading player info...</div>';
    try {
        const res = await fetch(`${CONFIG.API_URL}/players?id=${id}&season=2023`);
        const p = (await res.json()).response?.[0];
        if(!p) throw new Error();
        c.innerHTML = `<div class="player-hero"><img src="${p.player.photo}" class="player-photo-large"><div class="player-name-large">${p.player.name}</div></div><div class="player-stats-grid"><div class="p-stat-box"><div class="p-stat-title">Age</div><div class="p-stat-value">${p.player.age}</div></div><div class="p-stat-box"><div class="p-stat-title">Rating</div><div class="p-stat-value" style="color:var(--accent-color)">${parseFloat(p.statistics[0]?.games?.rating||0).toFixed(1)}</div></div></div>`;
    } catch(e) { c.innerHTML = '<div class="empty-msg">Player data unavailable.</div>'; }
}

// التشغيل الأولي
setupDatesBar();
fetchMatches(new Date().toISOString().split('T')[0]);
