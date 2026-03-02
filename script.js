/** * ==========================================
 * FR SPORT - PREMIUM EDITION (TOP LEAGUES ONLY)
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

// === نظام الأخبار الصارم (دوريات كبرى فقط + صور مضمونة) ===
async function fetchNews() {
    const container = document.getElementById('tab-news');
    if(!container) return;
    
    container.innerHTML = `
        <div class="news-top-nav">
            <div class="news-top-tab active" onclick="switchNewsSubTab('foryou')">Top Leagues</div>
            <div class="news-top-tab" onclick="switchNewsSubTab('transfers')">Transfers</div>
        </div>
        <div id="news-content-area">
            <div class="loader" style="margin-top:50px; color:var(--accent-color);">Fetching Premium News...</div>
        </div>
    `;
    
    try {
        // أقوى مصدرين في العالم (بدون ياهو المزعج)
        const feeds = [
            'https://www.espn.com/espn/rss/soccer/news',
            'http://feeds.bbci.co.uk/sport/football/rss.xml'
        ];

        const requests = feeds.map(url => fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`));
        const responses = await Promise.all(requests);

        let allArticles = [];
        for (let res of responses) {
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'ok' && data.items) {
                    allArticles = allArticles.concat(data.items);
                }
            }
        }

        // 1. فلتر الأندية والدوريات الكبرى (لن يظهر أي خبر ضعيف)
        const eliteKeywords = ['madrid', 'barcelona', 'liverpool', 'manchester', 'arsenal', 'chelsea', 'tottenham', 'bayern', 'dortmund', 'juventus', 'milan', 'inter', 'napoli', 'psg', 'mbappe', 'guardiola', 'arteta', 'klopp', 'premier league', 'la liga', 'champions league'];
        
        const premiumArticles = [];
        const titles = new Set();

        allArticles.forEach(article => {
            const titleLower = article.title.toLowerCase();
            const isPremium = eliteKeywords.some(kw => titleLower.includes(kw));
            if(isPremium && !titles.has(article.title)) {
                titles.add(article.title);
                premiumArticles.push(article);
            }
        });

        // ترتيب الأخبار من الأحدث للأقدم
        premiumArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        if(premiumArticles.length === 0) premiumArticles.push(...allArticles.slice(0, 10)); // طوارئ فقط

        // 2. فلتر الانتقالات الكبرى فقط
        const transferKeywords = ['transfer', 'sign', 'deal', 'loan', 'bid', 'agrees', 'medical'];
        const transferArticles = premiumArticles.filter(article => {
            const t = article.title.toLowerCase();
            return transferKeywords.some(kw => t.includes(kw));
        });

        // صورة احتياطية فخمة (ملعب مضاء) بدلاً من علامة الاستفهام المعطوبة
        const defaultImg = 'https://images.unsplash.com/photo-1518605368461-1e1e38ce81c2?q=80&w=600&auto=format&fit=crop';

        // --- بناء قسم Top Leagues ---
        let forYouHtml = `<div id="news-foryou-content"><div class="trending-header"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg> Top Leagues Now</div><div class="news-feed">`;

        premiumArticles.slice(0, 20).forEach((article, index) => {
            let img = article.enclosure?.link || article.thumbnail || defaultImg;
            // حماية إضافية ضد الصور المعطوبة
            if(img.length < 15 || img.includes('yahoo')) img = defaultImg;

            let source = article.link.includes('espn') ? 'ESPN FC' : 'BBC Sport';
            let pubDate = new Date(article.pubDate).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});

            if (index === 0) {
                forYouHtml += `<div class="news-hero-card" onclick="window.open('${article.link}', '_blank')"><img src="${img}" class="news-hero-img" onerror="this.src='${defaultImg}'"><div class="news-hero-title">${article.title}</div><div class="news-date">${source} • ${pubDate}</div></div>`;
            } else {
                forYouHtml += `<div class="news-list-card" onclick="window.open('${article.link}', '_blank')"><div class="news-list-content"><div class="news-list-title">${article.title}</div><div class="news-date">${source} • ${pubDate}</div></div><img src="${img}" class="news-list-img" onerror="this.src='${defaultImg}'"></div>`;
            }
        });
        forYouHtml += `</div></div>`;

        // --- بناء قسم Transfers ---
        let transfersHtml = `<div id="news-transfers-content" class="hidden">
            <div class="trending-header" style="color:var(--accent-color);">Major Transfer News</div>
            <div class="news-feed">`;

        if (transferArticles.length > 0) {
            transferArticles.slice(0, 10).forEach((article) => {
                let img = article.enclosure?.link || article.thumbnail || defaultImg;
                if(img.length < 15 || img.includes('yahoo')) img = defaultImg;
                let source = article.link.includes('espn') ? 'ESPN FC' : 'BBC Sport';
                let pubDate = new Date(article.pubDate).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
                transfersHtml += `<div class="news-list-card" onclick="window.open('${article.link}', '_blank')"><div class="news-list-content"><div class="news-list-title">${article.title}</div><div class="news-date">${source} • ${pubDate}</div></div><img src="${img}" class="news-list-img" onerror="this.src='${defaultImg}'"></div>`;
            });
        } else {
            transfersHtml += `<div class="empty-msg">No premium transfer news right now.</div>`;
        }

        transfersHtml += `</div><div class="trending-header">Confirmed Top Deals</div><div class="news-feed" style="padding-top:10px;">`;

        // أيقونة لاعب افتراضية أنيقة لتجنب مشكلة الصور المكسورة
        const safeAvatar = 'https://cdn-icons-png.flaticon.com/512/3281/3281142.png';

        const hardcodedTransfers = [
            { name: "Kylian Mbappé", fee: "Free Transfer", fromLogo: "https://media.api-sports.io/football/teams/85.png", toLogo: "https://media.api-sports.io/football/teams/541.png", img: "https://media.api-sports.io/football/players/278.png" },
            { name: "Julián Álvarez", fee: "€75M", fromLogo: "https://media.api-sports.io/football/teams/50.png", toLogo: "https://media.api-sports.io/football/teams/530.png", img: safeAvatar }, 
            { name: "Leny Yoro", fee: "€62M", fromLogo: "https://media.api-sports.io/football/teams/79.png", toLogo: "https://media.api-sports.io/football/teams/33.png", img: safeAvatar }
        ];

        hardcodedTransfers.forEach(t => {
            transfersHtml += `<div class="transfer-card"><img src="${t.img}" class="transfer-player-img" onerror="this.src='${safeAvatar}'"><div class="transfer-info"><div class="transfer-name">${t.name}</div><div class="transfer-fee">${t.fee}</div><div class="transfer-clubs"><img src="${t.fromLogo}" class="transfer-club-logo" onerror="this.style.display='none'"><div class="transfer-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></div><img src="${t.toLogo}" class="transfer-club-logo" onerror="this.style.display='none'"></div></div></div>`;
        });

        transfersHtml += `</div></div>`;

        document.getElementById('news-content-area').innerHTML = forYouHtml + transfersHtml;

    } catch (e) {
        console.error(e);
        document.getElementById('news-content-area').innerHTML = `<div class="empty-msg" style="margin-top:50px;">Error loading premium news.</div>`;
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
    const id = league.id;
    const country = league.country ? league.country.toLowerCase() : '';
    if (id === 2 || id === 3 || id === 39) return 1; 
    const topEurope = ['england', 'spain', 'germany', 'italy', 'france'];
    if (topEurope.includes(country)) return 2;
    return 3; 
}

async function fetchMatches(date) {
    AppState.currentDate = date;
    const container = document.getElementById('tab-matches');
    if (!container) return;
    if (AppState.matchesCache[date]) { AppState.globalMatches = AppState.matchesCache[date]; renderMatchesList(AppState.globalMatches); return; }
    
    container.innerHTML = '<div class="loader">Fetching matches...</div>';
    try {
        const res = await fetch(`${CONFIG.API_URL}/fixtures?date=${date}`);
        if(!res.ok) throw new Error("Server error");
        const data = await res.json();
        const matches = data.response || [];
        AppState.matchesCache[date] = matches; AppState.globalMatches = matches;
        renderMatchesList(matches);
    } catch (error) { 
        container.innerHTML = '<div class="empty-msg">Server is sleeping or busy. Please refresh the page.</div>'; 
    }
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
        html += `<div class="league-group"><div class="league-header"><div class="league-title-wrapper"><img src="${group.info.logo}" class="league-logo" loading="lazy"><span class="league-name">${group.info.country} - ${group.info.name}</span></div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg></div>`;
        group.games.forEach(m => {
            const s = m.fixture.status.short;
            let centerContent = Utils.isNotStarted(s) ? `<div class="match-center">${new Date(m.fixture.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>` : Utils.isLiveMatch(s) ? `<div class="match-center live"><span style="font-size:10px;">${m.fixture.status.elapsed}'</span><br>${m.goals.home} - ${m.goals.away}</div>` : `<div class="match-center">${m.goals.home} - ${m.goals.away}</div>`;
            html += `<div class="match-row" onclick="openMatchDetails(${m.fixture.id})"><div class="match-teams-score"><span class="team-name home-name">${m.teams.home.name}</span><img src="${m.teams.home.logo}" class="team-logo" loading="lazy">${centerContent}<img src="${m.teams.away.logo}" class="team-logo" loading="lazy"><span class="team-name away-name">${m.teams.away.name}</span></div></div>`;
        });
        html += `</div>`;
    });
    container.innerHTML = html;
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function switchModalTab(tab) { document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.add('hidden')); event.target.classList.add('active'); document.getElementById(`modal-${tab}`).classList.remove('hidden'); }

function buildPitchHtml(teamLineup, teamInfo) {
    if (!teamLineup || !teamLineup.startXI || teamLineup.startXI.length === 0) return '';
    let html = `<div class="pitch-wrapper"><div class="pitch-header"><div class="pitch-team"><img src="${teamInfo.logo}">${teamInfo.name}</div><div class="pitch-formation">${teamLineup.formation || ''}</div></div><div class="pitch">`;
    const rows = {};
    teamLineup.startXI.forEach(item => { let gridParts = item.player.grid ? item.player.grid.split(':') : []; let rowNum = gridParts.length > 0 ? parseInt(gridParts[0]) : 1; if(!rows[rowNum]) rows[rowNum] = []; rows[rowNum].push(item.player); });
    Object.keys(rows).sort((a,b)=>a-b).forEach(key => {
        html += `<div class="pitch-row">`;
        rows[key].sort((a,b) => (a.grid ? parseInt(a.grid.split(':')[1]) : 0) - (b.grid ? parseInt(b.grid.split(':')[1]) : 0)).forEach(p => {
            html += `<div class="pitch-player" onclick="openPlayerDetails(${p.id})"><div class="pitch-player-img-wrapper"><img src="https://media.api-sports.io/football/players/${p.id}.png" class="pitch-player-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3281/3281142.png'; this.style.backgroundColor='#111';"><div class="pitch-player-num">${p.number || ''}</div></div><div class="pitch-player-name">${p.name.split(' ').pop()}</div></div>`;
        });
        html += `</div>`;
    });
    return html + `</div></div>`;
}

async function openMatchDetails(id) {
    const modal = document.getElementById('match-modal');
    const container = document.getElementById('match-info-container');
    modal.classList.remove('hidden');
    container.innerHTML = '<div class="loader">Fetching details...</div>';
    try {
        const [matchRes, injuriesRes] = await Promise.all([fetch(`${CONFIG.API_URL}/fixtures?id=${id}`), fetch(`${CONFIG.API_URL}/injuries?fixture=${id}`)]);
        const matchData = await matchRes.json(); const injuriesData = await injuriesRes.json();
        renderMatchDetailsModal(matchData.response?.[0], injuriesData.response || [], container);
    } catch (e) { container.innerHTML = '<div class="empty-msg">Error fetching details</div>'; }
}

function renderMatchDetailsModal(m, injuries, container) {
    if(!m) return;
    let matchStatus = m.fixture.status.short;
    let scoreOrTime = Utils.isNotStarted(matchStatus) ? new Date(m.fixture.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : `${m.goals.home ?? 0} - ${m.goals.away ?? 0}`;
    let subText = Utils.isNotStarted(matchStatus) ? 'Scheduled' : Utils.isLiveMatch(matchStatus) ? `<span style="color:var(--accent-color)">${m.fixture.status.elapsed}'</span>` : 'FT';

    let html = `<div class="match-hero"><div class="hero-team"><img src="${m.teams.home.logo}"><span class="p-name">${m.teams.home.name}</span></div><div class="hero-score-time"><div class="hero-score">${scoreOrTime}</div><div class="hero-sub">${subText}</div></div><div class="hero-team"><img src="${m.teams.away.logo}"><span class="p-name">${m.teams.away.name}</span></div></div><div class="tabs-container"><div class="tab-btn" onclick="switchModalTab('stats')">Stats</div><div class="tab-btn active" onclick="switchModalTab('lineups')">Lineups</div></div>`;

    let statsHtml = '<div id="modal-stats" class="modal-tab-content hidden">';
    if (m.statistics && m.statistics.length > 1) {
        m.statistics[0].statistics.forEach((stat, i) => {
            let hVal = stat.value ?? 0; let aVal = m.statistics[1].statistics[i].value ?? 0;
            let hNum = parseInt(String(hVal).replace('%','')) || 0; let aNum = parseInt(String(aVal).replace('%','')) || 0;
            let total = hNum + aNum; let hPercent = total > 0 ? (hNum / total) * 100 : 50; let aPercent = total > 0 ? (aNum / total) * 100 : 50;
            statsHtml += `<div class="stat-row"><div class="stat-header"><span>${hVal}</span><span>${stat.type}</span><span>${aVal}</span></div><div class="stat-bar-container"><div class="stat-bar-home" style="width:${hPercent}%"></div><div class="stat-bar-away" style="width:${aPercent}%"></div></div></div>`;
        });
    } else { statsHtml += '<div class="empty-msg">Stats not available yet</div>'; }
    statsHtml += '</div>';

    let lineupsHtml = '<div id="modal-lineups" class="modal-tab-content">';
    if (m.lineups && m.lineups.length > 1) {
        lineupsHtml += buildPitchHtml(m.lineups[0], m.teams.home) + buildPitchHtml(m.lineups[1], m.teams.away) + `<div class="lineup-section"><div class="section-title">Substitutes</div>`;
        let maxSubs = Math.max(m.lineups[0].substitutes.length, m.lineups[1].substitutes.length);
        for(let i=0; i<maxSubs; i++) {
            let hP = m.lineups[0].substitutes[i]?.player; let aP = m.lineups[1].substitutes[i]?.player;
            lineupsHtml += `<div class="player-row">${hP ? `<div class="player-side player-home" onclick="openPlayerDetails(${hP.id})"><span class="p-num">${hP.number||''}</span><img src="https://media.api-sports.io/football/players/${hP.id}.png" class="sub-player-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3281/3281142.png';"><span class="p-name">${hP.name||'-'}</span></div>` : '<div class="player-side player-home"></div>'}${aP ? `<div class="player-side player-away" onclick="openPlayerDetails(${aP.id})"><span class="p-name">${aP.name||'-'}</span><img src="https://media.api-sports.io/football/players/${aP.id}.png" class="sub-player-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3281/3281142.png';"><span class="p-num">${aP.number||''}</span></div>` : '<div class="player-side player-away"></div>'}</div>`;
        }
        lineupsHtml += `</div>`;
    } else { lineupsHtml += `<div class="empty-msg">Lineups not available</div>`; }
    lineupsHtml += '</div>';

    container.innerHTML = html + statsHtml + lineupsHtml;
}

async function openPlayerDetails(playerId) {
    if(!playerId) return;
    const modal = document.getElementById('player-modal');
    const container = document.getElementById('player-info-container');
    modal.classList.remove('hidden');
    container.innerHTML = '<div class="loader">Loading player data...</div>';

    try {
        const res = await fetch(`${CONFIG.API_URL}/players?id=${playerId}&season=2023`);
        const pData = (await res.json()).response?.[0];
        if(!pData) throw new Error("No data");

        const p = pData.player; const s = pData.statistics?.[0] || {};
        container.innerHTML = `<div class="player-hero"><img src="${p.photo}" class="player-photo-large" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3281/3281142.png';"><div class="player-name-large">${p.firstname} ${p.lastname}</div><div class="player-team-info"><img src="${s.team?.logo}" onerror="this.style.display='none'">${s.team?.name || ''} • ${p.nationality}</div></div><div class="player-stats-grid"><div class="p-stat-box"><div class="p-stat-title">Age</div><div class="p-stat-value">${p.age || '-'}</div></div><div class="p-stat-box"><div class="p-stat-title">Height</div><div class="p-stat-value">${p.height || '-'}</div></div><div class="p-stat-box"><div class="p-stat-title">Position</div><div class="p-stat-value">${s.games?.position || '-'}</div></div><div class="p-stat-box"><div class="p-stat-title">Rating</div><div class="p-stat-value" style="color:var(--accent-color)">${parseFloat(s.games?.rating || 0).toFixed(1) || '-'}</div></div><div class="p-stat-box"><div class="p-stat-title">Goals</div><div class="p-stat-value">${s.goals?.total || 0}</div></div><div class="p-stat-box"><div class="p-stat-title">Assists</div><div class="p-stat-value">${s.goals?.assists || 0}</div></div></div>`;
    } catch (e) { container.innerHTML = `<div class="empty-msg">Detailed info not available.</div>`; }
}

setupDatesBar();
fetchMatches(new Date().toISOString().split('T')[0]);
