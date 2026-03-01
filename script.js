const SERVER_URL = "https://spring-dream-011d.farhad10180.workers.dev";
let globalMatches = [];
let isLiveMode = false;

// تجهيز التواريخ
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

// نظام ترتيب الدوريات الجديد باحترافية
function getLeaguePriority(league) {
    const id = league.id;
    const country = league.country ? league.country.toLowerCase() : '';

    if (id === 2) return 1; // أبطال أوروبا
    if (id === 39) return 2; // إنجليزي
    if (id === 140) return 3; // إسباني
    if (id === 78) return 4; // ألماني
    if (id === 135) return 5; // إيطالي
    if (id === 61) return 6; // فرنسي
    if (id === 3 || id === 848 || country === 'world' || country === 'europe') return 7; // بطولات أوروبا الأخرى
    
    const europe = ['england', 'spain', 'germany', 'italy', 'france', 'portugal', 'netherlands', 'belgium', 'scotland', 'turkey'];
    if (europe.includes(country)) return 8; // باقي أوروبا

    const asia = ['saudi arabia', 'uae', 'qatar', 'japan', 'south korea', 'iran', 'australia', 'asia', 'iraq'];
    if (asia.includes(country)) return 9; // آسيا

    const america = ['brazil', 'argentina', 'usa', 'mexico', 'colombia', 'chile', 'south-america'];
    if (america.includes(country)) return 10; // أمريكا

    return 11; // أفريقيا وغيرها
}

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
        return getLeaguePriority(a.info) - getLeaguePriority(b.info);
    });

    if(sortedLeagues.length === 0) { container.innerHTML = '<div class="empty-msg">لا توجد مباريات حالياً</div>'; return; }

    let html = '';
    sortedLeagues.forEach(group => {
        html += `
        <div class="league-group">
            <div class="league-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
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
                centerContent = `<div class="match-center live" dir="ltr"><span style="font-size:10px;">${m.fixture.status.elapsed}'</span><br>${m.goals.home} - ${m.goals.away}</div>`;
            } else {
                centerContent = `<div class="match-center" dir="ltr">${m.goals.home} - ${m.goals.away}</div>`;
            }

            html += `
            <div class="match-row" onclick="openMatchDetails(${m.fixture.id})">
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

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// نظام الإحصائيات والتشكيلة
async function openMatchDetails(id) {
    document.getElementById('match-modal').classList.remove('hidden');
    const container = document.getElementById('match-info-container');
    container.innerHTML = '<div class="loader">جاري جلب التفاصيل...</div>';

    try {
        // جلب تفاصيل المباراة والإصابات في نفس الوقت
        const [matchRes, injuriesRes] = await Promise.all([
            fetch(`${SERVER_URL}/fixtures?id=${id}`),
            fetch(`${SERVER_URL}/injuries?fixture=${id}`)
        ]);
        
        const matchData = await matchRes.json();
        const injuriesData = await injuriesRes.json();
        const m = matchData.response[0];
        if(!m) return;

        // الهيدر
        let html = `
        <div class="match-hero">
            <div class="hero-team"><img src="${m.teams.home.logo}" width="50"><span class="p-name">${m.teams.home.name}</span></div>
            <div class="hero-score" dir="ltr">${m.goals.home ?? '-'} - ${m.goals.away ?? '-'}</div>
            <div class="hero-team"><img src="${m.teams.away.logo}" width="50"><span class="p-name">${m.teams.away.name}</span></div>
        </div>
        <div class="tabs-container">
            <div class="tab-btn active" onclick="switchModalTab('stats')">الإحصائيات</div>
            <div class="tab-btn" onclick="switchModalTab('lineups')">التشكيلة</div>
        </div>
        `;

        // الإحصائيات
        let statsHtml = '<div id="modal-stats">';
        if (m.statistics && m.statistics.length > 1) {
            const hStats = m.statistics[0].statistics;
            const aStats = m.statistics[1].statistics;
            
            for(let i=0; i<hStats.length; i++) {
                let hVal = hStats[i].value ?? 0;
                let aVal = aStats[i].value ?? 0;
                let type = hStats[i].type;
                
                // تحويل النسب إلى أرقام
                let hNum = parseInt(hVal.toString().replace('%','')) || 0;
                let aNum = parseInt(aVal.toString().replace('%','')) || 0;
                let total = hNum + aNum;
                let hPercent = total > 0 ? (hNum / total) * 100 : 50;
                let aPercent = total > 0 ? (aNum / total) * 100 : 50;

                statsHtml += `
                <div class="stat-row">
                    <div class="stat-header"><span>${hVal}</span><span>${type}</span><span>${aVal}</span></div>
                    <div class="stat-bar-container">
                        <div class="stat-bar-home" style="width:${hPercent}%"></div>
                        <div class="stat-bar-away" style="width:${aPercent}%"></div>
                    </div>
                </div>`;
            }
        } else {
            statsHtml += '<div class="empty-msg">الإحصائيات غير متوفرة بعد</div>';
        }
        statsHtml += '</div>';

        // التشكيلة
        let lineupsHtml = '<div id="modal-lineups" class="hidden">';
        const subIcon = `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="16 16 12 20 8 16"></polyline><line x1="12" y1="20" x2="12" y2="4"></line></svg>`;
        const injuryIcon = `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

        if (m.lineups && m.lineups.length > 1) {
            const hL = m.lineups[0]; const aL = m.lineups[1];
            
            // الأساسيون
            lineupsHtml += `<div class="lineup-section"><div class="section-title">الأساسيون</div>`;
            for(let i=0; i<11; i++) {
                let hP = hL.startXI[i]?.player; let aP = aL.startXI[i]?.player;
                if(!hP && !aP) break;
                lineupsHtml += `
                <div class="player-row">
                    <div class="player-side player-home"><span class="p-num">${hP?.number||'-'}</span><span class="p-name">${hP?.name||'-'}</span></div>
                    <div class="player-side player-away"><span class="p-num">${aP?.number||'-'}</span><span class="p-name">${aP?.name||'-'}</span></div>
                </div>`;
            }
            lineupsHtml += `</div>`;

            // الاحتياط
            lineupsHtml += `<div class="lineup-section"><div class="section-title">الاحتياط ${subIcon}</div>`;
            let maxSubs = Math.max(hL.substitutes.length, aL.substitutes.length);
            for(let i=0; i<maxSubs; i++) {
                let hP = hL.substitutes[i]?.player; let aP = aL.substitutes[i]?.player;
                lineupsHtml += `
                <div class="player-row">
                    <div class="player-side player-home"><span class="p-num">${hP?.number||'-'}</span><span class="p-name">${hP?.name||'-'}</span></div>
                    <div class="player-side player-away"><span class="p-num">${aP?.number||'-'}</span><span class="p-name">${aP?.name||'-'}</span></div>
                </div>`;
            }
            lineupsHtml += `</div>`;
        } else {
            lineupsHtml += '<div class="empty-msg">التشكيلة غير متوفرة بعد</div>';
        }

        // الغيابات والإصابات
        const inj = injuriesData.response || [];
        if (inj.length > 0) {
            lineupsHtml += `<div class="lineup-section"><div class="section-title" style="color:#ff3b30">الغيابات ${injuryIcon}</div>`;
            const hInj = inj.filter(i => i.team.id === m.teams.home.id);
            const aInj = inj.filter(i => i.team.id === m.teams.away.id);
            let maxInj = Math.max(hInj.length, aInj.length);
            
            for(let i=0; i<maxInj; i++) {
                let hP = hInj[i]?.player; let aP = aInj[i]?.player;
                lineupsHtml += `
                <div class="player-row">
                    <div class="player-side player-home"><span class="p-name" style="color:#ff3b30">${hP?.name||'-'}</span></div>
                    <div class="player-side player-away"><span class="p-name" style="color:#ff3b30">${aP?.name||'-'}</span></div>
                </div>`;
            }
            lineupsHtml += `</div>`;
        }
        lineupsHtml += '</div>';

        container.innerHTML = html + statsHtml + lineupsHtml;

    } catch (e) {
        container.innerHTML = '<div class="empty-msg">حدث خطأ في جلب التفاصيل</div>';
    }
}

function switchModalTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('modal-stats').classList.add('hidden');
    document.getElementById('modal-lineups').classList.add('hidden');
    
    event.target.classList.add('active');
    document.getElementById(`modal-${tab}`).classList.remove('hidden');
}

setupDatesBar();
fetchMatches(new Date().toISOString().split('T')[0]);
