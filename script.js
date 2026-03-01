const SERVER_URL = "https://spring-dream-011d.farhad10180.workers.dev";
const TOP_LEAGUES = [2, 3, 39, 140, 135, 78, 61, 307, 1, 4];
let globalMatches = [];
let isLiveMode = false;

// تجهيز التواريخ بصيغة (جمعة 27 فبراير)
function formatArabicDate(dateObj, offset) {
    if (offset === 0) return "اليوم";
    if (offset === -1) return "أمس";
    if (offset === 1) return "غداً";
    
    const days = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    
    return `${days[dateObj.getDay()]} ${dateObj.getDate().toString().padStart(2, '0')} ${months[dateObj.getMonth()]}`;
}

function setupDatesBar() {
    const container = document.getElementById('dates-container');
    if (!container) return;
    container.innerHTML = '';
    const today = new Date();
    for (let i = -7; i <= 7; i++) {
        let d = new Date(); d.setDate(today.getDate() + i);
        let dateStr = d.toISOString().split('T')[0];
        let label = formatArabicDate(d, i);
        let active = i === 0 ? "active" : "";
        container.innerHTML += `<div class="date-item ${active}" id="btn-${dateStr}" onclick="selectDate('${dateStr}')">${label}</div>`;
    }
    setTimeout(() => { document.querySelector('.date-item.active')?.scrollIntoView({ behavior: 'smooth', inline: 'center' }); }, 100);
}

function selectDate(dateStr) {
    document.querySelectorAll('.date-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`btn-${dateStr}`).classList.add('active');
    document.getElementById(`btn-${dateStr}`).scrollIntoView({ behavior: 'smooth', inline: 'center' });
    fetchMatches(dateStr);
}

function switchTab(el) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    el.classList.add('active');
    if(el.innerText.includes('المباريات')) {
        document.getElementById('tab-matches').classList.remove('hidden');
        document.getElementById('tab-other').classList.add('hidden');
    } else {
        document.getElementById('tab-matches').classList.add('hidden');
        document.getElementById('tab-other').classList.remove('hidden');
    }
}

function toggleLive(btn) {
    btn.classList.toggle('active');
    isLiveMode = btn.classList.contains('active');
    renderUI(globalMatches);
}

function isLiveMatch(status) { return ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(status); }

async function fetchMatches(date) {
    const container = document.getElementById('tab-matches');
    if (!container) return;
    container.innerHTML = '<div class="loader">جاري جلب المباريات...</div>';
    try {
        const res = await fetch(`${SERVER_URL}/fixtures?date=${date}`);
        const data = await res.json();
        globalMatches = data.response || [];
        renderUI(globalMatches);
    } catch (e) { container.innerHTML = '<div class="empty-msg">حدث خطأ في الاتصال</div>'; }
}

function renderUI(matches) {
    const container = document.getElementById('tab-matches');
    if (!container || !matches || matches.length === 0) { 
        if(container) container.innerHTML = '<div class="empty-msg">لا توجد مباريات</div>'; 
        return; 
    }

    const leaguesGroup = {};
    matches.forEach(m => {
        if(isLiveMode && !isLiveMatch(m.fixture.status.short)) return;
        
        if (!leaguesGroup[m.league.name]) leaguesGroup[m.league.name] = { info: m.league, games: [] };
        leaguesGroup[m.league.name].games.push(m);
    });

    const sortedLeagues = Object.values(leaguesGroup).sort((a, b) => {
        const aTop = TOP_LEAGUES.includes(a.info.id) ? TOP_LEAGUES.indexOf(a.info.id) : 999;
        const bTop = TOP_LEAGUES.includes(b.info.id) ? TOP_LEAGUES.indexOf(b.info.id) : 999;
        return aTop - bTop;
    });

    if(sortedLeagues.length === 0) { container.innerHTML = '<div class="empty-msg">لا توجد مباريات حالياً</div>'; return; }

    let html = '';
    sortedLeagues.forEach(group => {
        html += `
        <div class="league-group">
            <div class="league-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
                <div class="league-title-wrapper">
                    <img src="${group.info.logo}" class="league-logo">
                    <span class="league-name">${group.info.country} - ${group.info.name}</span>
                </div>
            </div>`;

        group.games.forEach(m => {
            const s = m.fixture.status.short;
            const isLive = isLiveMatch(s);
            const isNotStarted = ['NS', 'TBD'].includes(s);
            
            let centerContent = '';
            if (isNotStarted) {
                const timeStr = new Date(m.fixture.date).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit', hour12: true });
                centerContent = `<div class="match-center">${timeStr}</div>`;
            } else if (isLive) {
                centerContent = `<div class="match-center live" dir="ltr"><span style="color:#ff3b30; font-size:10px;">${m.fixture.status.elapsed}'</span><br>${m.goals.home} - ${m.goals.away}</div>`;
            } else {
                centerContent = `<div class="match-center" dir="ltr">${m.goals.home} - ${m.goals.away}</div>`;
            }

            html += `
            <div class="match-row">
                <div class="tv-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg></div>
                
                <div class="match-teams-score">
                    <div class="team-side team-away">
                        <span class="team-name">${m.teams.away.name}</span>
                        <img src="${m.teams.away.logo}" class="team-logo">
                    </div>
                    
                    ${centerContent}
                    
                    <div class="team-side team-home">
                        <img src="${m.teams.home.logo}" class="team-logo">
                        <span class="team-name">${m.teams.home.name}</span>
                    </div>
                </div>
            </div>`;
        });
        html += `</div>`;
    });

    container.innerHTML = html;
}

setupDatesBar();
fetchMatches(new Date().toISOString().split('T')[0]);
