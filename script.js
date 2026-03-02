/** * ==========================================
 * FR SPORT - MAIN APPLICATION SCRIPT (FOTMOB STYLE)
 * ==========================================
 */

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
    isLiveMatch: (statusShort) => CONFIG.LIVE_STATUSES.includes(statusShort),
    isNotStarted: (statusShort) => CONFIG.NOT_STARTED_STATUSES.includes(statusShort)
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
    fetchMatches(dateStr);
}

function switchTab(el) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    el.classList.add('active');
    const isMatchesTab = el.innerText.includes('Matches');
    document.getElementById('tab-matches').classList.toggle('hidden', !isMatchesTab);
    document.getElementById('tab-other').classList.toggle('hidden', isMatchesTab);
}

function toggleLive(btn) {
    btn.classList.toggle('active');
    AppState.isLiveMode = btn.classList.contains('active');
    renderMatchesList(AppState.globalMatches);
}

function getLeaguePriority(league) {
    const id = league.id;
    const country = league.country ? league.country.toLowerCase() : '';
    if (id === 2) return 1; if (id === 3) return 2; if (id === 39) return 3; 
    if (id === 140) return 4; if (id === 78) return 5; if (id === 135) return 6; 
    if (id === 61) return 7; if (id === 307) return 8; 
    const topEurope = ['england', 'spain', 'germany', 'italy', 'france'];
    if (topEurope.includes(country)) return 9;
    const otherEurope = ['portugal', 'netherlands', 'belgium', 'scotland', 'turkey', 'greece', 'europe', 'world'];
    if (otherEurope.includes(country)) return 10;
    const asia = ['saudi arabia', 'uae', 'qatar', 'japan', 'south korea', 'iran', 'australia', 'asia', 'iraq'];
    if (asia.includes(country)) return 11;
    const america = ['brazil', 'argentina', 'usa', 'mexico', 'colombia', 'chile', 'uruguay', 'south-america'];
    if (america.includes(country)) return 12;
    return 13; 
}

async function fetchMatches(date) {
    AppState.currentDate = date;
    const container = document.getElementById('tab-matches');
    if (!container) return;
    if (AppState.matchesCache[date]) { AppState.globalMatches = AppState.matchesCache[date]; renderMatchesList(AppState.globalMatches); return; }
    container.innerHTML = '<div class="loader">Fetching matches...</div>';
    try {
        const res = await fetch(`${CONFIG.API_URL}/fixtures?date=${date}`);
        const data = await res.json();
        const matches = data.response || [];
        AppState.matchesCache[date] = matches; AppState.globalMatches = matches;
        renderMatchesList(matches);
    } catch (error) { container.innerHTML = '<div class="empty-msg">Connection Error</div>'; }
}

function renderMatchesList(matches) {
    const container = document.getElementById('tab-matches');
    if (!matches || matches.length === 0) { container.innerHTML = '<div class="empty-msg">No matches today</div>'; return; }
    const leaguesGroup = {};
    matches.forEach(m => {
        if (AppState.isLiveMode && !Utils.isLiveMatch(m.fixture.status.short)) return;
        if (!leaguesGroup[m.league.name]) { leaguesGroup[m.league.name] = { info: m.league, games: [] }; }
        leaguesGroup[m.league.name].games.push(m);
    });
    const sortedLeagues = Object.values(leaguesGroup).sort((a, b) => getLeaguePriority(a.info) - getLeaguePriority(b.info));
    if (sortedLeagues.length === 0) { container.innerHTML = '<div class="empty-msg">No live matches right now</div>'; return; }

    let html = '';
    sortedLeagues.forEach(group => {
        html += `
        <div class="league-group">
            <div class="league-header">
                <div class="league-title-wrapper">
                    <img src="${group.info.logo}" class="league-logo" loading="lazy">
                    <span class="league-name">${group.info.country} - ${group.info.name}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
            </div>`;
        group.games.forEach(m => {
            const s = m.fixture.status.short;
            let centerContent = '';
            if (Utils.isNotStarted(s)) {
                const timeStr = new Date(m.fixture.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                centerContent = `<div class="match-center">${timeStr}</div>`;
            } else if (Utils.isLiveMatch(s)) {
                centerContent = `<div class="match-center live"><span style="font-size:10px;">${m.fixture.status.elapsed}'</span><br>${m.goals.home} - ${m.goals.away}</div>`;
            } else {
                centerContent = `<div class="match-center">${m.goals.home} - ${m.goals.away}</div>`;
            }
            html += `
            <div class="match-row" onclick="openMatchDetails(${m.fixture.id})">
                <div class="match-teams-score">
                    <span class="team-name home-name">${m.teams.home.name}</span>
                    <img src="${m.teams.home.logo}" class="team-logo" loading="lazy">
                    ${centerContent}
                    <img src="${m.teams.away.logo}" class="team-logo" loading="lazy">
                    <span class="team-name away-name">${m.teams.away.name}</span>
                </div>
                <div class="tv-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg></div>
            </div>`;
        });
        html += `</div>`;
    });
    container.innerHTML = html;
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function switchModalTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.add('hidden'));
    event.target.classList.add('active');
    document.getElementById(`modal-${tab}`).classList.remove('hidden');
}

function buildPitchHtml(teamLineup, teamInfo, isAway) {
    if (!teamLineup || !teamLineup.startXI || teamLineup.startXI.length === 0) return '';
    
    let html = `<div class="pitch-wrapper">
        <div class="pitch-header">
            <div class="pitch-team"><img src="${teamInfo.logo}">${teamInfo.name}</div>
            <div class="pitch-formation">${teamLineup.formation || ''}</div>
        </div>
        <div class="pitch">`;

    const rows = {};
    teamLineup.startXI.forEach(item => {
        let p = item.player;
        let gridParts = p.grid ? p.grid.split(':') : [];
        let rowNum = gridParts.length > 0 ? parseInt(gridParts[0]) : 1;
        if(!rows[rowNum]) rows[rowNum] = [];
        rows[rowNum].push(p);
    });

    let rowKeys = Object.keys(rows).map(Number).sort((a,b) => a - b);
    
    rowKeys.forEach(key => {
        html += `<div class="pitch-row">`;
        let playersInRow = rows[key].sort((a,b) => {
            let colA = a.grid ? parseInt(a.grid.split(':')[1]) : 0;
            let colB = b.grid ? parseInt(b.grid.split(':')[1]) : 0;
            return colA - colB;
        });

        playersInRow.forEach(p => {
            let imgUrl = `https://media.api-sports.io/football/players/${p.id}.png`;
            let lastName = p.name.split(' ').pop();
            html += `
                <div class="pitch-player" onclick="openPlayerDetails(${p.id})">
                    <div class="pitch-player-img-wrapper">
                        <img src="${imgUrl}" class="pitch-player-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23555\\' stroke-width=\\'2\\'><circle cx=\\'12\\' cy=\\'8\\' r=\\'4\\'/><path d=\\'M20 21a8 8 0 0 0-16 0\\'/></svg>'; this.style.backgroundColor='#111';">
                        <div class="pitch-player-num">${p.number || ''}</div>
                    </div>
                    <div class="pitch-player-name">${lastName}</div>
                </div>
            `;
        });
        html += `</div>`;
    });

    html += `</div></div>`;
    return html;
}

async function openMatchDetails(id) {
    const modal = document.getElementById('match-modal');
    const container = document.getElementById('match-info-container');
    modal.classList.remove('hidden');
    container.innerHTML = '<div class="loader">Fetching details...</div>';

    try {
        const [matchRes, injuriesRes] = await Promise.all([
            fetch(`${CONFIG.API_URL}/fixtures?id=${id}`),
            fetch(`${CONFIG.API_URL}/injuries?fixture=${id}`)
        ]);
        const matchData = await matchRes.json();
        const injuriesData = await injuriesRes.json();
        const m = matchData.response?.[0];
        if(!m) throw new Error("Match not found");
        renderMatchDetailsModal(m, injuriesData.response || [], container);
    } catch (e) {
        container.innerHTML = '<div class="empty-msg">Error fetching details</div>';
    }
}

function renderMatchDetailsModal(m, injuries, container) {
    let matchStatus = m.fixture.status.short;
    let scoreOrTime = '';
    let subText = '';

    if (Utils.isNotStarted(matchStatus)) {
        scoreOrTime = new Date(m.fixture.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        subText = new Date(m.fixture.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (Utils.isLiveMatch(matchStatus)) {
        scoreOrTime = `${m.goals.home ?? 0} - ${m.goals.away ?? 0}`;
        subText = `<span style="color:var(--accent-color)">${m.fixture.status.elapsed}'</span>`;
    } else {
        scoreOrTime = `${m.goals.home ?? 0} - ${m.goals.away ?? 0}`;
        subText = 'FT';
    }

    let html = `
    <div class="match-hero">
        <div class="hero-team">
            <img src="${m.teams.home.logo}">
            <span class="p-name">${m.teams.home.name}</span>
        </div>
        <div class="hero-score-time">
            <div class="hero-score">${scoreOrTime}</div>
            <div class="hero-sub">${subText}</div>
        </div>
        <div class="hero-team">
            <img src="${m.teams.away.logo}">
            <span class="p-name">${m.teams.away.name}</span>
        </div>
    </div>
    
    <div class="tabs-container">
        <div class="tab-btn" onclick="switchModalTab('preview')">Preview</div>
        <div class="tab-btn" onclick="switchModalTab('stats')">Stats</div>
        <div class="tab-btn active" onclick="switchModalTab('lineups')">Lineups</div>
    </div>
    `;

    // Preview Tab
    let venueName = m.fixture.venue?.name || 'Unknown Stadium';
    let venueCity = m.fixture.venue?.city || '';
    let referee = m.fixture.referee || 'Referee not announced';

    let previewHtml = `
    <div id="modal-preview" class="modal-tab-content hidden">
        <div class="info-card">
            <div class="info-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>
            <div><div class="info-text-main">${venueName}</div><div class="info-text-sub">${venueCity}</div></div>
        </div>
        <div class="info-card">
            <div class="info-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></div>
            <div><div class="info-text-main">${referee}</div><div class="info-text-sub">Referee</div></div>
        </div>
    </div>`;

    // Stats Tab
    let statsHtml = '<div id="modal-stats" class="modal-tab-content hidden">';
    if (m.statistics && m.statistics.length > 1) {
        const hStats = m.statistics[0].statistics; const aStats = m.statistics[1].statistics;
        hStats.forEach((stat, i) => {
            let hVal = stat.value ?? 0; let aVal = aStats[i].value ?? 0;
            let hNum = parseInt(String(hVal).replace('%','')) || 0; let aNum = parseInt(String(aVal).replace('%','')) || 0;
            let total = hNum + aNum;
            let hPercent = total > 0 ? (hNum / total) * 100 : 50; let aPercent = total > 0 ? (aNum / total) * 100 : 50;
            statsHtml += `
            <div class="stat-row">
                <div class="stat-header"><span>${hVal}</span><span>${stat.type}</span><span>${aVal}</span></div>
                <div class="stat-bar-container"><div class="stat-bar-home" style="width:${hPercent}%"></div><div class="stat-bar-away" style="width:${aPercent}%"></div></div>
            </div>`;
        });
    } else {
        statsHtml += '<div class="empty-msg">Stats not available yet</div>';
    }
    statsHtml += '</div>';

    // Lineups Tab (With Sub Photos & Waiting Screen)
    let lineupsHtml = '<div id="modal-lineups" class="modal-tab-content">';
    if (m.lineups && m.lineups.length > 1) {
        const [hL, aL] = m.lineups;
        
        lineupsHtml += buildPitchHtml(hL, m.teams.home, false);
        lineupsHtml += buildPitchHtml(aL, m.teams.away, true);

        lineupsHtml += `<div class="lineup-section"><div class="section-title">Substitutes</div>`;
        let maxSubs = Math.max(hL.substitutes.length, aL.substitutes.length);
        for(let i=0; i<maxSubs; i++) {
            let hP = hL.substitutes[i]?.player; let aP = aL.substitutes[i]?.player;
            lineupsHtml += buildPlayerRow(hP, aP);
        }
        lineupsHtml += `</div>`;
    } else {
        if (Utils.isNotStarted(matchStatus)) {
            lineupsHtml += `
            <div class="empty-msg" style="margin-top: 40px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="1.5" style="margin-bottom:15px; opacity: 0.8;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <br>
                <span style="font-size:16px; font-weight:bold; color:var(--text-main);">Lineups not available yet</span><br>
                <span style="font-size:13px; margin-top:5px; display:block;">Confirmed lineups will appear approximately 1 hour before kick-off.</span>
            </div>`;
        } else {
            lineupsHtml += '<div class="empty-msg">Lineups not available</div>';
        }
    }

    if (injuries.length > 0) {
        lineupsHtml += `<div class="lineup-section"><div class="section-title" style="color:#ff3b30">Missing Players</div>`;
        const hInj = injuries.filter(i => i.team.id === m.teams.home.id);
        const aInj = injuries.filter(i => i.team.id === m.teams.away.id);
        let maxInj = Math.max(hInj.length, aInj.length);
        for(let i=0; i<maxInj; i++) {
            let hP = hInj[i]?.player; let aP = aInj[i]?.player;
            lineupsHtml += buildPlayerRow(hP, aP);
        }
        lineupsHtml += `</div>`;
    }
    lineupsHtml += '</div>';

    container.innerHTML = html + previewHtml + statsHtml + lineupsHtml;
}

function buildPlayerRow(hP, aP) {
    let homeHtml = '<div class="player-side player-home"></div>';
    if (hP) {
        let imgUrl = `https://media.api-sports.io/football/players/${hP.id}.png`;
        homeHtml = `
        <div class="player-side player-home" onclick="openPlayerDetails(${hP.id})">
            <span class="p-num">${hP.number||''}</span>
            <img src="${imgUrl}" class="sub-player-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23555\\' stroke-width=\\'2\\'><circle cx=\\'12\\' cy=\\'8\\' r=\\'4\\'/><path d=\\'M20 21a8 8 0 0 0-16 0\\'/></svg>';">
            <span class="p-name">${hP.name||'-'}</span>
        </div>`;
    }

    let awayHtml = '<div class="player-side player-away"></div>';
    if (aP) {
        let imgUrl = `https://media.api-sports.io/football/players/${aP.id}.png`;
        awayHtml = `
        <div class="player-side player-away" onclick="openPlayerDetails(${aP.id})">
            <span class="p-name">${aP.name||'-'}</span>
            <img src="${imgUrl}" class="sub-player-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23555\\' stroke-width=\\'2\\'><circle cx=\\'12\\' cy=\\'8\\' r=\\'4\\'/><path d=\\'M20 21a8 8 0 0 0-16 0\\'/></svg>';">
            <span class="p-num">${aP.number||''}</span>
        </div>`;
    }
    
    return `<div class="player-row">${homeHtml}${awayHtml}</div>`;
}

async function openPlayerDetails(playerId) {
    if(!playerId) return;
    
    const modal = document.getElementById('player-modal');
    const container = document.getElementById('player-info-container');
    
    modal.classList.remove('hidden');
    container.innerHTML = '<div class="loader">Fetching player data...</div>';

    try {
        const res = await fetch(`${CONFIG.API_URL}/players?id=${playerId}&season=2023`);
        const data = await res.json();
        const pData = data.response?.[0];

        if(!pData) throw new Error("No data");

        const player = pData.player;
        const stats = pData.statistics?.[0] || {};
        const team = stats.team || {};

        let html = `
            <div class="player-hero">
                <img src="${player.photo}" class="player-photo-large" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23555\\' stroke-width=\\'2\\'><circle cx=\\'12\\' cy=\\'8\\' r=\\'4\\'/><path d=\\'M20 21a8 8 0 0 0-16 0\\'/></svg>';">
                <div class="player-name-large">${player.firstname} ${player.lastname}</div>
                <div class="player-team-info">
                    <img src="${team.logo}" onerror="this.style.display='none'">
                    ${team.name || 'Unknown Team'} • ${player.nationality}
                </div>
            </div>

            <div class="player-stats-grid">
                <div class="p-stat-box">
                    <div class="p-stat-title">Age</div>
                    <div class="p-stat-value">${player.age || '-'} Years</div>
                </div>
                <div class="p-stat-box">
                    <div class="p-stat-title">Height</div>
                    <div class="p-stat-value">${player.height || '-'}</div>
                </div>
                <div class="p-stat-box">
                    <div class="p-stat-title">Position</div>
                    <div class="p-stat-value">${stats.games?.position || '-'}</div>
                </div>
                <div class="p-stat-box">
                    <div class="p-stat-title">Rating</div>
                    <div class="p-stat-value" style="color:var(--accent-color)">${parseFloat(stats.games?.rating || 0).toFixed(1) || '-'}</div>
                </div>
                <div class="p-stat-box">
                    <div class="p-stat-title">Goals</div>
                    <div class="p-stat-value">${stats.goals?.total || 0}</div>
                </div>
                <div class="p-stat-box">
                    <div class="p-stat-title">Assists</div>
                    <div class="p-stat-value">${stats.goals?.assists || 0}</div>
                </div>
            </div>
        `;
        container.innerHTML = html;

    } catch (e) {
        console.error(e);
        container.innerHTML = `
            <div class="empty-msg">
                Detailed info not available for this player.<br>
                <span style="font-size:10px; color:#555">ID: ${playerId}</span>
            </div>`;
    }
}

setupDatesBar();
fetchMatches(new Date().toISOString().split('T')[0]);
