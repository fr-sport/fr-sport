/** * ==========================================
 * FR SPORT - ULTIMATE ARABIC EDITION (FULL TRANSLATION)
 * ==========================================
 */

const CONFIG = {
    API_URL: "https://spring-dream-011d.farhad10180.workers.dev",
    LIVE_STATUSES: ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'PEN'],
    NOT_STARTED_STATUSES: ['NS', 'TBD']
};

const AppState = { matchesCache: {}, globalMatches: [], isLiveMode: false, currentDate: '' };

// === قاموس FR SPORT الذهبي للترجمة (أضف أي فريق هنا مستقبلاً) ===
const ARABIC_DICTIONARY = {
    // الدول
    "World": "عالمي",
    "England": "إنجلترا",
    "Spain": "إسبانيا",
    "Italy": "إيطاليا",
    "Germany": "ألمانيا",
    "France": "فرنسا",
    "Portugal": "البرتغال",
    "Saudi Arabia": "السعودية",

    // الدوريات والبطولات
    "Premier League": "الدوري الإنجليزي الممتاز",
    "Championship": "دوري البطولة الإنجليزية",
    "La Liga": "الدوري الإسباني",
    "Serie A": "الدوري الإيطالي",
    "Bundesliga": "الدوري الألماني",
    "Ligue 1": "الدوري الفرنسي",
    "Primeira Liga": "الدوري البرتغالي",
    "UEFA Champions League": "دوري أبطال أوروبا",
    "UEFA Europa League": "الدوري الأوروبي",
    "Saudi Pro League": "الدوري السعودي",
    "AFC Champions League": "دوري أبطال آسيا",

    // الأندية الإنجليزية
    "Arsenal": "أرسنال",
    "Aston Villa": "أستون فيلا",
    "Chelsea": "تشيلسي",
    "Liverpool": "ليفربول",
    "Manchester City": "مانشستر سيتي",
    "Manchester United": "مانشستر يونايتد",
    "Newcastle": "نيوكاسل",
    "Tottenham": "توتنهام",
    "Middlesbrough": "ميدلزبره",
    "Birmingham": "برمنغهام",

    // الأندية الإسبانية
    "Real Madrid": "ريال مدريد",
    "Barcelona": "برشلونة",
    "Atletico Madrid": "أتلتيكو مدريد",
    "Sevilla": "إشبيلية",
    "Getafe": "خيتافي",
    "Valencia": "فالنسيا",

    // الأندية الإيطالية
    "Juventus": "يوفنتوس",
    "AC Milan": "ميلان",
    "Inter": "إنتر ميلان",
    "Napoli": "نابولي",
    "AS Roma": "روما",
    "Bologna": "بولونيا",
    "Fiorentina": "فيورنتينا",
    "Pisa": "بيزا",
    "Udinese": "أودينيزي",

    // أندية آسيوية وعربية
    "Al-Duhail SC": "الدحيل",
    "Al-Ahli Jeddah": "الأهلي السعودي",
    "Tractor Sazi": "تراكتور سازي",
    "Shabab Al Ahli Dubai": "شباب الأهلي دبي",
    "Al Hilal": "الهلال",
    "Al Nassr": "النصر"
};

// دالة الترجمة الذكية
function translateName(name) {
    if(!name) return "";
    return ARABIC_DICTIONARY[name] || name;
}

const Utils = {
    formatDateEn: (dateObj, offset) => {
        if (offset === 0) return "اليوم";
        if (offset === -1) return "الأمس";
        if (offset === 1) return "غداً";
        const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
        return `${days[dateObj.getDay()]} ${dateObj.getDate()} ${months[dateObj.getMonth()]}`;
    },
    isLiveMatch: (s) => CONFIG.LIVE_STATUSES.includes(s),
    isNotStarted: (s) => CONFIG.NOT_STARTED_STATUSES.includes(s)
};

const TOP_LEAGUES = [
    { id: 39, nameAr: "الدوري الإنجليزي الممتاز", logo: "https://media.api-sports.io/football/leagues/39.png" },
    { id: 140, nameAr: "الدوري الإسباني", logo: "https://media.api-sports.io/football/leagues/140.png" },
    { id: 135, nameAr: "الدوري الإيطالي", logo: "https://media.api-sports.io/football/leagues/135.png" },
    { id: 78, nameAr: "الدوري الألماني", logo: "https://media.api-sports.io/football/leagues/78.png" },
    { id: 61, nameAr: "الدوري الفرنسي", logo: "https://media.api-sports.io/football/leagues/61.png" },
    { id: 2, nameAr: "دوري أبطال أوروبا", logo: "https://media.api-sports.io/football/leagues/2.png" },
    { id: 307, nameAr: "الدوري السعودي للمحترفين", logo: "https://media.api-sports.io/football/leagues/307.png" }
];

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
    const leaguesTab = document.getElementById('tab-leagues');
    if(leaguesTab) leaguesTab.classList.add('hidden');
    
    const tabName = el.innerText.trim();
    const datesWrapper = document.querySelector('.dates-wrapper');
    
    if(tabName === 'Matches' || tabName === 'المباريات') {
        document.getElementById('tab-matches').classList.remove('hidden');
        if(datesWrapper) datesWrapper.style.display = 'block'; 
    } else if(tabName === 'News' || tabName === 'أخبار') {
        if(newsTab) newsTab.classList.remove('hidden');
        if(datesWrapper) datesWrapper.style.display = 'none'; 
        if(newsTab && (newsTab.innerHTML.includes('Click') || newsTab.innerHTML.trim() === '')) fetchNews();
    } else if(tabName === 'Leagues' || tabName === 'البطولات') {
        if(leaguesTab) leaguesTab.classList.remove('hidden');
        if(datesWrapper) datesWrapper.style.display = 'none'; 
        renderLeaguesTab(); 
    } else {
        if(datesWrapper) datesWrapper.style.display = 'none';
    }
}

function toggleLive(btn) {
    btn.classList.toggle('active');
    AppState.isLiveMode = btn.classList.contains('active');
    renderMatchesList(AppState.globalMatches);
}

function renderLeaguesTab() {
    const container = document.getElementById('tab-leagues');
    if (!container) return;
    
    let html = `<div class="trending-header" style="padding-top:0;">أبرز البطولات العالمية</div><div class="leagues-grid">`;
    TOP_LEAGUES.forEach(l => {
        html += `
        <div class="league-card" onclick="openLeagueStandings(${l.id})">
            <img src="${l.logo}" class="league-card-logo">
            <div class="league-card-info">
                <div class="league-card-name">${l.nameAr}</div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="transform: rotate(180deg);"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

async function openLeagueStandings(leagueId) {
    const modal = document.getElementById('standings-modal');
    const container = document.getElementById('standings-container');
    modal.classList.remove('hidden');
    container.innerHTML = '<div class="loader" style="margin-top:50px;">جاري تحميل جدول الترتيب...</div>';

    try {
        const res = await fetch(`${CONFIG.API_URL}/standings?league=${leagueId}&season=2023`);
        const data = await res.json();
        const leagueData = data.response?.[0]?.league;
        
        if(!leagueData || !leagueData.standings || leagueData.standings.length === 0) throw new Error("No standings");

        const translatedLeagueName = translateName(leagueData.name);

        let html = `
        <div class="match-hero" style="padding:20px; text-align:center;">
            <img src="${leagueData.logo}" style="width:70px; height:70px; margin-bottom:10px;">
            <div class="player-name-large" style="font-size:18px;">${translatedLeagueName}</div>
        </div>
        <div class="standings-table">
            <div class="st-header">
                <div class="st-rank">#</div>
                <div class="st-team">الفريق</div>
                <div class="st-p">لعب</div>
                <div class="st-gd">فارق</div>
                <div class="st-pts">نقاط</div>
            </div>`;

        const standingsArray = leagueData.standings[0]; 

        standingsArray.forEach(row => {
            const translatedTeamName = translateName(row.team.name);
            html += `
            <div class="st-row">
                <div class="st-rank">${row.rank}</div>
                <div class="st-team"><img src="${row.team.logo}" onerror="this.style.display='none'">${translatedTeamName}</div>
                <div class="st-p">${row.all.played}</div>
                <div class="st-gd" style="direction:ltr;">${row.goalsDiff > 0 ? '+'+row.goalsDiff : row.goalsDiff}</div>
                <div class="st-pts">${row.points}</div>
            </div>`;
        });
        html += `</div>`;
        container.innerHTML = html;

    } catch (e) {
        container.innerHTML = '<div class="empty-msg" style="margin-top:50px;">جدول الترتيب غير متوفر حالياً لهذه البطولة.</div>';
    }
}

async function fetchNews() {
    const container = document.getElementById('tab-news');
    if(!container) return;
    
    container.innerHTML = `
        <div class="news-top-nav">
            <div class="news-top-tab active" onclick="switchNewsSubTab('foryou')">دوريات كبرى</div>
            <div class="news-top-tab" onclick="switchNewsSubTab('transfers')">انتقالات</div>
        </div>
        <div id="news-content-area">
            <div class="loader" style="margin-top:50px; color:var(--accent-color);">جاري جلب الأخبار...</div>
        </div>
    `;
    
    try {
        const eplUrl = 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news?limit=50';
        const laligaUrl = 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/news?limit=50';
        const globalUrl = 'https://site.api.espn.com/apis/site/v2/sports/soccer/global/news?limit=50';

        const [eplRes, laligaRes, globalRes] = await Promise.all([ fetch(eplUrl), fetch(laligaUrl), fetch(globalUrl) ]);
        const eplData = await eplRes.json(); const laligaData = await laligaRes.json(); const globalData = await globalRes.json();

        let allArticles = [];
        if(eplData.articles) allArticles.push(...eplData.articles);
        if(laligaData.articles) allArticles.push(...laligaData.articles);
        if(globalData.articles) allArticles.push(...globalData.articles);

        let uniqueArticles = []; let titles = new Set();
        allArticles.forEach(a => { if(!titles.has(a.headline)) { titles.add(a.headline); uniqueArticles.push(a); } });
        uniqueArticles.sort((a,b) => new Date(b.published) - new Date(a.published));
        if(uniqueArticles.length === 0) throw new Error();

        const transferKeywords = ['transfer', 'sign', 'deal', 'loan', 'bid', 'contract', 'move', 'medical', 'agrees', 'agreed', 'swap', 'buy', 'sell'];
        const transferArticles = uniqueArticles.filter(a => transferKeywords.some(kw => a.headline.toLowerCase().includes(kw) || a.description?.toLowerCase().includes(kw)));
        const defaultImg = 'https://images.unsplash.com/photo-1518605368461-1e1e38ce81c2?q=80&w=600&auto=format&fit=crop';

        let forYouHtml = `<div id="news-foryou-content"><div class="trending-header">أحدث الأخبار العالمية</div><div class="news-feed">`;
        uniqueArticles.slice(0, 30).forEach((article, index) => {
            let title = article.headline; let link = article.links?.web?.href || '#'; let pubDate = new Date(article.published).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
            let img = article.images && article.images.length > 0 ? article.images[0].url : defaultImg;
            if (index === 0) { forYouHtml += `<div class="news-hero-card" onclick="window.open('${link}', '_blank')"><img src="${img}" class="news-hero-img" onerror="this.src='${defaultImg}'"><div class="news-hero-title">${title}</div><div class="news-date" style="text-align:left;">ESPN FC • ${pubDate}</div></div>`; } 
            else { forYouHtml += `<div class="news-list-card" onclick="window.open('${link}', '_blank')"><div class="news-list-content"><div class="news-list-title">${title}</div><div class="news-date" style="text-align:left;">ESPN FC • ${pubDate}</div></div><img src="${img}" class="news-list-img" onerror="this.src='${defaultImg}'"></div>`; }
        });
        forYouHtml += `</div></div>`;

        let transfersHtml = `<div id="news-transfers-content" class="hidden"><div class="trending-header" style="color:var(--accent-color);">أخبار الانتقالات المباشرة</div><div class="news-feed">`;
        if (transferArticles.length > 0) {
            transferArticles.slice(0, 20).forEach(article => {
                let title = article.headline; let link = article.links?.web?.href || '#'; let pubDate = new Date(article.published).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
                let img = article.images && article.images.length > 0 ? article.images[0].url : defaultImg;
                transfersHtml += `<div class="news-list-card" onclick="window.open('${link}', '_blank')"><div class="news-list-content"><div class="news-list-title" style="font-weight: 800;">${title}</div><div class="news-date" style="text-align:left;">Transfers • ${pubDate}</div></div><img src="${img}" class="news-list-img" onerror="this.src='${defaultImg}'"></div>`;
            });
        } else { transfersHtml += `<div class="empty-msg">لا توجد أخبار انتقالات حالياً.</div>`; }
        transfersHtml += `</div></div>`;
        document.getElementById('news-content-area').innerHTML = forYouHtml + transfersHtml;

    } catch (e) { document.getElementById('news-content-area').innerHTML = `<div class="empty-msg" style="margin-top:50px;">خطأ في جلب الأخبار.</div>`; }
}

function switchNewsSubTab(tabId) {
    document.querySelectorAll('.news-top-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('news-foryou-content').classList.add('hidden');
    document.getElementById('news-transfers-content').classList.add('hidden');
    document.getElementById(`news-${tabId}-content`).classList.remove('hidden');
}

function getLeaguePriority(league) {
    const id = league.id; const name = league.name ? league.name.toLowerCase() : '';
    if ([2, 3, 4, 1, 15, 17, 848].includes(id)) return 1;
    if ([39, 140, 135, 78, 61].includes(id)) return 2;
    if ([307, 253, 88, 94, 40].includes(id)) return 3;
    if (name.includes('u21') || name.includes('u20') || name.includes('u19') || name.includes('u17') || name.includes('women') || name.includes('friendlies') || name.includes('development') || name.includes('reserve') || name.includes('primavera') || name.includes('youth')) return 999;
    return 100;
}

async function fetchMatches(date) {
    AppState.currentDate = date;
    const container = document.getElementById('tab-matches');
    if (!container) return;
    if (AppState.matchesCache[date]) { AppState.globalMatches = AppState.matchesCache[date]; renderMatchesList(AppState.globalMatches); return; }
    
    container.innerHTML = '<div class="loader">جاري جلب المباريات...</div>';
    try {
        const res = await fetch(`${CONFIG.API_URL}/fixtures?date=${date}`);
        if(!res.ok) throw new Error("Server error");
        const data = await res.json();
        const matches = data.response || [];
        AppState.matchesCache[date] = matches; AppState.globalMatches = matches;
        renderMatchesList(matches);
    } catch (error) { container.innerHTML = '<div class="empty-msg">تعذر الاتصال بالخادم. الرجاء تحديث الصفحة.</div>'; }
}

function renderMatchesList(matches) {
    const container = document.getElementById('tab-matches');
    if (!matches || matches.length === 0) { container.innerHTML = '<div class="empty-msg">لا توجد مباريات اليوم</div>'; return; }
    
    const leaguesGroup = {};
    matches.forEach(m => {
        if (AppState.isLiveMode && !Utils.isLiveMatch(m.fixture.status.short)) return;
        const lId = m.league.id;
        if (!leaguesGroup[lId]) { leaguesGroup[lId] = { info: m.league, games: [] }; }
        leaguesGroup[lId].games.push(m);
    });

    const sortedLeagues = Object.values(leaguesGroup).sort((a, b) => {
        let priorityA = getLeaguePriority(a.info); let priorityB = getLeaguePriority(b.info);
        if(priorityA !== priorityB) return priorityA - priorityB;
        return a.info.name.localeCompare(b.info.name);
    });

    if (sortedLeagues.length === 0) { container.innerHTML = '<div class="empty-msg">لا توجد مباريات جارية حالياً</div>'; return; }

    let html = '';
    sortedLeagues.forEach(group => {
        const translatedLeagueName = translateName(group.info.name);
        const translatedCountry = translateName(group.info.country); // تمت إضافة ترجمة الدولة هنا

        html += `<div class="league-group"><div class="league-header"><div class="league-title-wrapper"><img src="${group.info.logo}" class="league-logo"><span class="league-name">${translatedCountry} - ${translatedLeagueName}</span></div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg></div>`;
        group.games.forEach(m => {
            const s = m.fixture.status.short;
            let hGoals = m.goals.home !== null ? m.goals.home : '';
            let aGoals = m.goals.away !== null ? m.goals.away : '';
            let centerContent = '';
            if (Utils.isNotStarted(s)) {
                const timeStr = new Date(m.fixture.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                centerContent = `<div class="match-center" style="direction:ltr;">${timeStr}</div>`;
            } else if (Utils.isLiveMatch(s)) {
                centerContent = `<div class="match-center live"><span style="font-size:10px;">${m.fixture.status.elapsed}'</span><br>${hGoals} - ${aGoals}</div>`;
            } else { centerContent = `<div class="match-center">${hGoals} - ${aGoals}</div>`; }

            const translatedHomeTeam = translateName(m.teams.home.name);
            const translatedAwayTeam = translateName(m.teams.away.name);

            html += `<div class="match-row" onclick="openMatchDetails(${m.fixture.id})"><div class="match-teams-score"><span class="team-name home-name">${translatedHomeTeam}</span><img src="${m.teams.home.logo}" class="team-logo">${centerContent}<img src="${m.teams.away.logo}" class="team-logo"><span class="team-name away-name">${translatedAwayTeam}</span></div></div>`;
        });
        html += `</div>`;
    });
    container.innerHTML = html;
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function switchModalTab(tab) { document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.add('hidden')); event.target.classList.add('active'); document.getElementById(`modal-${tab}`).classList.remove('hidden'); }

function buildPitchHtml(teamLineup, teamInfo) {
    if (!teamLineup || !teamLineup.startXI || teamLineup.startXI.length === 0) return '';
    const translatedTeamName = translateName(teamInfo.name);
    let html = `<div class="pitch-wrapper"><div class="pitch-header"><div class="pitch-team"><img src="${teamInfo.logo}">${translatedTeamName}</div><div class="pitch-formation">${teamLineup.formation || ''}</div></div><div class="pitch">`;
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
    container.innerHTML = '<div class="loader" style="margin-top:50px;">جاري جلب التفاصيل...</div>';
    try {
        const [matchRes, injuriesRes] = await Promise.all([fetch(`${CONFIG.API_URL}/fixtures?id=${id}`), fetch(`${CONFIG.API_URL}/injuries?fixture=${id}`)]);
        const matchData = await matchRes.json(); const injuriesData = await injuriesRes.json();
        renderMatchDetailsModal(matchData.response?.[0], injuriesData.response || [], container);
    } catch (e) { container.innerHTML = '<div class="empty-msg">خطأ في جلب التفاصيل</div>'; }
}

function renderMatchDetailsModal(m, injuries, container) {
    if(!m) return;
    let matchStatus = m.fixture.status.short;
    let scoreOrTime = Utils.isNotStarted(matchStatus) ? new Date(m.fixture.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : `${m.goals.home ?? 0} - ${m.goals.away ?? 0}`;
    let subText = Utils.isNotStarted(matchStatus) ? 'لم تبدأ' : Utils.isLiveMatch(matchStatus) ? `<span style="color:var(--accent-color)">${m.fixture.status.elapsed}'</span>` : 'انتهت';

    const translatedHomeTeam = translateName(m.teams.home.name);
    const translatedAwayTeam = translateName(m.teams.away.name);

    let html = `<div class="match-hero"><div class="hero-team"><img src="${m.teams.home.logo}"><span class="p-name">${translatedHomeTeam}</span></div><div class="hero-score-time"><div class="hero-score" style="direction:ltr;">${scoreOrTime}</div><div class="hero-sub">${subText}</div></div><div class="hero-team"><img src="${m.teams.away.logo}"><span class="p-name">${translatedAwayTeam}</span></div></div><div class="tabs-container"><div class="tab-btn" onclick="switchModalTab('stats')">إحصائيات</div><div class="tab-btn active" onclick="switchModalTab('lineups')">التشكيلة</div></div>`;

    let statsHtml = '<div id="modal-stats" class="modal-tab-content hidden">';
    if (m.statistics && m.statistics.length > 1) {
        m.statistics[0].statistics.forEach((stat, i) => {
            let hVal = stat.value ?? 0; let aVal = m.statistics[1].statistics[i].value ?? 0;
            let hNum = parseInt(String(hVal).replace('%','')) || 0; let aNum = parseInt(String(aVal).replace('%','')) || 0;
            let total = hNum + aNum; let hPercent = total > 0 ? (hNum / total) * 100 : 50; let aPercent = total > 0 ? (aNum / total) * 100 : 50;
            statsHtml += `<div class="stat-row"><div class="stat-header"><span>${hVal}</span><span>${stat.type}</span><span>${aVal}</span></div><div class="stat-bar-container"><div class="stat-bar-home" style="width:${hPercent}%"></div><div class="stat-bar-away" style="width:${aPercent}%"></div></div></div>`;
        });
    } else { statsHtml += '<div class="empty-msg">الإحصائيات غير متوفرة بعد</div>'; }
    statsHtml += '</div>';

    let lineupsHtml = '<div id="modal-lineups" class="modal-tab-content">';
    if (m.lineups && m.lineups.length > 1) {
        lineupsHtml += buildPitchHtml(m.lineups[0], m.teams.home) + buildPitchHtml(m.lineups[1], m.teams.away) + `<div class="lineup-section"><div class="section-title">البدلاء</div>`;
        let maxSubs = Math.max(m.lineups[0].substitutes.length, m.lineups[1].substitutes.length);
        for(let i=0; i<maxSubs; i++) {
            let hP = m.lineups[0].substitutes[i]?.player; let aP = m.lineups[1].substitutes[i]?.player;
            lineupsHtml += `<div class="player-row">${hP ? `<div class="player-side player-home" onclick="openPlayerDetails(${hP.id})"><span class="p-num">${hP.number||''}</span><img src="https://media.api-sports.io/football/players/${hP.id}.png" class="sub-player-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3281/3281142.png';"><span class="p-name">${hP.name||'-'}</span></div>` : '<div class="player-side player-home"></div>'}${aP ? `<div class="player-side player-away" onclick="openPlayerDetails(${aP.id})"><span class="p-name">${aP.name||'-'}</span><img src="https://media.api-sports.io/football/players/${aP.id}.png" class="sub-player-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3281/3281142.png';"><span class="p-num">${aP.number||''}</span></div>` : '<div class="player-side player-away"></div>'}</div>`;
        }
        lineupsHtml += `</div>`;
    } else { lineupsHtml += `<div class="empty-msg">التشكيلة غير متوفرة</div>`; }
    lineupsHtml += '</div>';

    container.innerHTML = html + statsHtml + lineupsHtml;
}

async function openPlayerDetails(playerId) {
    if(!playerId) return;
    const modal = document.getElementById('player-modal');
    const container = document.getElementById('player-info-container');
    modal.classList.remove('hidden');
    container.innerHTML = '<div class="loader" style="margin-top:50px;">جاري جلب بيانات اللاعب...</div>';

    try {
        const res = await fetch(`${CONFIG.API_URL}/players?id=${playerId}&season=2023`);
        const pData = (await res.json()).response?.[0];
        if(!pData) throw new Error("No data");

        const p = pData.player; const s = pData.statistics?.[0] || {};
        const translatedTeamName = translateName(s.team?.name);
        const translatedNationality = translateName(p.nationality);

        container.innerHTML = `<div class="player-hero"><img src="${p.photo}" class="player-photo-large" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3281/3281142.png';"><div class="player-name-large">${p.firstname} ${p.lastname}</div><div class="player-team-info"><img src="${s.team?.logo}" onerror="this.style.display='none'">${translatedTeamName || ''} • ${translatedNationality}</div></div><div class="player-stats-grid"><div class="p-stat-box"><div class="p-stat-title">العمر</div><div class="p-stat-value">${p.age || '-'}</div></div><div class="p-stat-box"><div class="p-stat-title">الطول</div><div class="p-stat-value">${p.height || '-'}</div></div><div class="p-stat-box"><div class="p-stat-title">المركز</div><div class="p-stat-value">${s.games?.position || '-'}</div></div><div class="p-stat-box"><div class="p-stat-title">التقييم</div><div class="p-stat-value" style="color:var(--accent-color)">${parseFloat(s.games?.rating || 0).toFixed(1) || '-'}</div>
