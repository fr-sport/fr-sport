/** * ==========================================
 * FR SPORT - MAIN APPLICATION SCRIPT
 * ==========================================
 */

// === 1. الثوابت وإعدادات التطبيق (Constants) ===
const CONFIG = {
    API_URL: "https://spring-dream-011d.farhad10180.workers.dev",
    LIVE_STATUSES: ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'PEN'],
    NOT_STARTED_STATUSES: ['NS', 'TBD']
};

// === 2. حالة التطبيق والذاكرة المؤقتة (State & Cache) ===
const AppState = {
    matchesCache: {}, // نظام كاش لتخزين المباريات التي تم جلبها (للسرعة الصاروخية)
    globalMatches: [],
    isLiveMode: false,
    currentDate: ''
};


// === 3. أدوات مساعدة (Utilities) ===
const Utils = {
    formatArabicDate: (dateObj, offset) => {
        if (offset === 0) return "اليوم";
        if (offset === -1) return "أمس";
        if (offset === 1) return "غداً";
        const days = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
        const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
        return `${days[dateObj.getDay()]} ${dateObj.getDate().toString().padStart(2, '0')} ${months[dateObj.getMonth()]}`;
    },
    isLiveMatch: (statusShort) => CONFIG.LIVE_STATUSES.includes(statusShort),
    isNotStarted: (statusShort) => CONFIG.NOT_STARTED_STATUSES.includes(statusShort)
};


// === 4. واجهة المستخدم والتنقل (UI & Navigation) ===
function setupDatesBar() {
    const container = document.getElementById('dates-container');
    if (!container) return;
    
    let html = '';
    const today = new Date();
    
    for (let i = -7; i <= 7; i++) {
        let d = new Date(); 
        d.setDate(today.getDate() + i);
        let dateStr = d.toISOString().split('T')[0];
        let label = Utils.formatArabicDate(d, i);
        let active = i === 0 ? "active" : "";
        html += `<div class="date-item ${active}" id="btn-${dateStr}" onclick="selectDate('${dateStr}')">${label}</div>`;
    }
    
    container.innerHTML = html;
    
    // تمرير الشريط لليوم الحالي بسلاسة
    setTimeout(() => { 
        document.querySelector('.date-item.active')?.scrollIntoView({ behavior: 'smooth', inline: 'center' }); 
    }, 100);
}

function selectDate(dateStr) {
    if (AppState.currentDate === dateStr) return; // منع إعادة التحميل إذا كنا في نفس اليوم
    
    document.querySelectorAll('.date-item').forEach(el => el.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${dateStr}`);
    if(activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
    
    fetchMatches(dateStr);
}

function switchTab(el) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    el.classList.add('active');
    
    const isMatchesTab = el.innerText.includes('المباريات');
    document.getElementById('tab-matches').classList.toggle('hidden', !isMatchesTab);
    document.getElementById('tab-other').classList.toggle('hidden', isMatchesTab);
}

function toggleLive(btn) {
    btn.classList.toggle('active');
    AppState.isLiveMode = btn.classList.contains('active');
    renderMatchesList(AppState.globalMatches);
}


// === 5. ترتيب الدوريات (Sorting Engine) ===
function getLeaguePriority(league) {
    const id = league.id;
    const country = league.country?.toLowerCase() || '';
    const name = league.name?.toLowerCase() || '';

    if (id === 2 || name.includes('champions league')) return 1;
    if (id === 39 || (country === 'england' && name.includes('premier league'))) return 2;
    if (id === 140 || (country === 'spain' && name.includes('la liga'))) return 3;
    if (id === 78 || (country === 'germany' && name.includes('bundesliga'))) return 4;
    if (id === 135 || (country === 'italy' && name.includes('serie a'))) return 5;
    if (id === 61 || (country === 'france' && name.includes('ligue 1'))) return 6;
    if (country === 'england') return 7;
    if (id === 3 || id === 848 || id === 532 || country === 'europe' || name.includes('uefa')) return 8;
    
    const europe = ['spain', 'germany', 'italy', 'france', 'portugal', 'netherlands', 'belgium', 'scotland', 'turkey', 'greece'];
    if (europe.includes(country)) return 9;

    const asia = ['saudi arabia', 'uae', 'qatar', 'japan', 'south korea', 'iran', 'australia', 'asia', 'iraq'];
    if (asia.includes(country)) return 10;

    const america = ['brazil', 'argentina', 'usa', 'mexico', 'colombia', 'chile', 'uruguay', 'south-america'];
    if (america.includes(country)) return 11;

    return 12; 
}


// === 6. جلب البيانات (API Fetching with Cache) ===
async function fetchMatches(date) {
    AppState.currentDate = date;
    const container = document.getElementById('tab-matches');
    if (!container) return;

    // التحقق من الذاكرة المؤقتة (Cache) للسرعة!
    if (AppState.matchesCache[date]) {
        AppState.globalMatches = AppState.matchesCache[date];
        renderMatchesList(AppState.globalMatches);
        return;
    }

    container.innerHTML = '<div class="loader">جاري جلب المباريات...</div>';
    
    try {
        const res = await fetch(`${CONFIG.API_URL}/fixtures?date=${date}`);
        const data = await res.json();
        const matches = data.response || [];
        
        // حفظ البيانات في الكاش
        AppState.matchesCache[date] = matches;
        AppState.globalMatches = matches;
        
        renderMatchesList(matches);
    } catch (error) { 
        console.error("Fetch Error:", error);
        container.innerHTML = '<div class="empty-msg">حدث خطأ في الاتصال بالسيرفر</div>'; 
    }
}


// === 7. عرض المباريات (Rendering Logic) ===
function renderMatchesList(matches) {
    const container = document.getElementById('tab-matches');
    
    if (!matches || matches.length === 0) { 
        container.innerHTML = '<div class="empty-msg">لا توجد مباريات في هذا اليوم</div>'; 
        return; 
    }

    // فلترة البث المباشر وتجميع الدوريات
    const leaguesGroup = {};
    matches.forEach(m => {
        if (AppState.isLiveMode && !Utils.isLiveMatch(m.fixture.status.short)) return;
        
        if (!leaguesGroup[m.league.name]) {
            leaguesGroup[m.league.name] = { info: m.league, games: [] };
        }
        leaguesGroup[m.league.name].games.push(m);
    });

    const sortedLeagues = Object.values(leaguesGroup).sort((a, b) => {
        return getLeaguePriority(a.info) - getLeaguePriority(b.info);
    });

    if (sortedLeagues.length === 0) { 
        container.innerHTML = '<div class="empty-msg">لا توجد مباريات جارية حالياً</div>'; 
        return; 
    }

    // بناء الواجهة
    let html = '';
    sortedLeagues.forEach(group => {
        html += `
        <div class="league-group">
            <div class="league-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
                <div class="league-title-wrapper">
                    <img src="${group.info.logo}" class="league-logo" loading="lazy">
                    <span class="league-name">${group.info.country} - ${group.info.name}</span>
                </div>
            </div>`;

        group.games.forEach(m => {
            const s = m.fixture.status.short;
            let centerContent = '';
            
            if (Utils.isNotStarted(s)) {
                const timeStr = new Date(m.fixture.date).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit', hour12: true });
                centerContent = `<div class="match-center">${timeStr}</div>`;
            } else if (Utils.isLiveMatch(s)) {
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
                        <img src="${m.teams.away.logo}" class="team-logo" loading="lazy">
                    </div>
                    ${centerContent}
                    <div class="team-side team-home">
                        <img src="${m.teams.home.logo}" class="team-logo" loading="lazy">
                        <span class="team-name">${m.teams.home.name}</span>
                    </div>
                </div>
            </div>`;
        });
        html += `</div>`;
    });
    
    container.innerHTML = html;
}


// === 8. النافذة المنبثقة وتفاصيل المباراة (Modal & Match Details) ===
function closeModal(id) { 
    document.getElementById(id).classList.add('hidden'); 
}

function switchModalTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('modal-stats').classList.add('hidden');
    document.getElementById('modal-lineups').classList.add('hidden');
    
    event.target.classList.add('active');
    document.getElementById(`modal-${tab}`).classList.remove('hidden');
}

async function openMatchDetails(id) {
    const modal = document.getElementById('match-modal');
    const container = document.getElementById('match-info-container');
    
    modal.classList.remove('hidden');
    container.innerHTML = '<div class="loader">جاري جلب التفاصيل...</div>';

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
        console.error(e);
        container.innerHTML = '<div class="empty-msg">حدث خطأ في جلب التفاصيل أو لا توجد بيانات متاحة</div>';
    }
}

function renderMatchDetailsModal(m, injuries, container) {
    // 1. الهيدر (Hero)
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

    // 2. الإحصائيات (Stats)
    let statsHtml = '<div id="modal-stats">';
    if (m.statistics && m.statistics.length > 1) {
        const hStats = m.statistics[0].statistics;
        const aStats = m.statistics[1].statistics;
        
        hStats.forEach((stat, i) => {
            let hVal = stat.value ?? 0;
            let aVal = aStats[i].value ?? 0;
            
            let hNum = parseInt(String(hVal).replace('%','')) || 0;
            let aNum = parseInt(String(aVal).replace('%','')) || 0;
            let total = hNum + aNum;
            
            let hPercent = total > 0 ? (hNum / total) * 100 : 50;
            let aPercent = total > 0 ? (aNum / total) * 100 : 50;

            statsHtml += `
            <div class="stat-row">
                <div class="stat-header"><span>${hVal}</span><span>${stat.type}</span><span>${aVal}</span></div>
                <div class="stat-bar-container">
                    <div class="stat-bar-home" style="width:${hPercent}%"></div>
                    <div class="stat-bar-away" style="width:${aPercent}%"></div>
                </div>
            </div>`;
        });
    } else {
        statsHtml += '<div class="empty-msg">الإحصائيات غير متوفرة بعد</div>';
    }
    statsHtml += '</div>';

    // 3. التشكيلة والغيابات (Lineups & Injuries)
    let lineupsHtml = '<div id="modal-lineups" class="hidden">';
    const subIcon = `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="16 16 12 20 8 16"></polyline><line x1="12" y1="20" x2="12" y2="4"></line></svg>`;
    const injuryIcon = `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

    if (m.lineups && m.lineups.length > 1) {
        const [hL, aL] = m.lineups;
        
        // الأساسيون
        lineupsHtml += `<div class="lineup-section"><div class="section-title">الأساسيون</div>`;
        for(let i=0; i<11; i++) {
            let hP = hL.startXI[i]?.player; let aP = aL.startXI[i]?.player;
            if(!hP && !aP) break;
            lineupsHtml += buildPlayerRow(hP, aP);
        }
        lineupsHtml += `</div>`;

        // الاحتياط
        lineupsHtml += `<div class="lineup-section"><div class="section-title">الاحتياط ${subIcon}</div>`;
        let maxSubs = Math.max(hL.substitutes.length, aL.substitutes.length);
        for(let i=0; i<maxSubs; i++) {
            let hP = hL.substitutes[i]?.player; let aP = aL.substitutes[i]?.player;
            lineupsHtml += buildPlayerRow(hP, aP);
        }
        lineupsHtml += `</div>`;
    } else {
        lineupsHtml += '<div class="empty-msg">التشكيلة غير متوفرة بعد</div>';
    }

    // الغيابات
    if (injuries.length > 0) {
        lineupsHtml += `<div class="lineup-section"><div class="section-title" style="color:#ff3b30">الغيابات ${injuryIcon}</div>`;
        const hInj = injuries.filter(i => i.team.id === m.teams.home.id);
        const aInj = injuries.filter(i => i.team.id === m.teams.away.id);
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
}

// دالة مساعدة لبناء سطر اللاعب في التشكيلة
function buildPlayerRow(hP, aP) {
    return `
    <div class="player-row">
        <div class="player-side player-home"><span class="p-num">${hP?.number||'-'}</span><span class="p-name">${hP?.name||'-'}</span></div>
        <div class="player-side player-away"><span class="p-num">${aP?.number||'-'}</span><span class="p-name">${aP?.name||'-'}</span></div>
    </div>`;
}

// === 9. تهيئة التطبيق (Init) ===
setupDatesBar();
fetchMatches(new Date().toISOString().split('T')[0]);
