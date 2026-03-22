import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, where, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDL53-XOe8FFCqoWNzHdJJnLksYoxihxGw",
    authDomain: "fr-sport-19893.firebaseapp.com",
    projectId: "fr-sport-19893",
    storageBucket: "fr-sport-19893.firebasestorage.app",
    messagingSenderId: "627967441082",
    appId: "1:627967441082:web:4600e2d1ceea5789722a83",
    measurementId: "G-NS69W4HDMW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// نظام المستخدم لتخزين المفضلة في Firebase
let userId = localStorage.getItem('fr_user_id');
if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('fr_user_id', userId);
}

const CONFIG = {
    LIVE_STATUSES: ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'PEN'],
    NOT_STARTED_STATUSES: ['NS', 'TBD']
};

const AppState = { 
    matchesCache: {}, 
    globalMatches: [], 
    followingLeagues: [], // تخزين البطولات المفضلة
    isLiveMode: false, 
    currentDate: '', 
    currentLang: localStorage.getItem('frsport_lang') || 'ar' 
};

// جلب المفضلة من Firebase عند بدء التطبيق
async function loadFollowingData() {
    try {
        const docSnap = await getDoc(doc(db, "users_following", userId));
        if (docSnap.exists() && docSnap.data().leagues) {
            AppState.followingLeagues = docSnap.data().leagues;
        }
    } catch(e) { console.error("Error loading following data:", e); }
}
loadFollowingData();

const UI_DICTIONARY = {
    ar: {
        live: "مباشر", matches: "المباريات", news: "أخبار", leagues: "البطولات", following: "يتابع", search: "بحث",
        today: "اليوم", yesterday: "الأمس", tomorrow: "غداً", loadingMatches: "جاري جلب المباريات...",
        noMatches: "لا توجد مباريات في هذا التاريخ", noLiveMatches: "لا توجد مباريات جارية حالياً", loadingNews: "جاري جلب الأخبار...",
        topLeaguesNow: "دوريات كبرى", liveTransfers: "انتقالات", topNews: "أحدث الأخبار الرياضية", topDeals: "أخبار الانتقالات والصفقات",
        standings: "جدول الترتيب", team: "الفريق", played: "لعب", gd: "فارق", pts: "نقاط",
        stats: "إحصائيات", lineups: "التشكيلة", subs: "البدلاء", age: "العمر", height: "الطول",
        position: "المركز", rating: "التقييم", goals: "الأهداف", assists: "الصناعة", notStarted: "لم تبدأ", finished: "انتهت",
        loading: "جاري التحميل...", errorLoad: "حدث خطأ في الاتصال بقاعدة البيانات.", noData: "البيانات غير متوفرة حالياً", transfersWord: "انتقالات",
        statsUnavailable: "الإحصائيات غير متوفرة", lineupsUnavailable: "التشكيلة غير متوفرة", standingsUnavailable: "جدول الترتيب غير متوفر",
        close: "إغلاق", todayBtn: "اليوم",
        sbAccount: "الحساب", sbMainScreen: "الشاشة الرئيسية", sbHome: "قم باختيار الشاشة الرئيسية",
        sbNewsLeagues: "الأخبار والبطولات", sbAllLeagues: "كل البطولات", sbSettings: "إعدادات",
        sbLanguage: "اللغة", sbNotifications: "إشعارات",
        follow: "متابعة", unfollow: "إلغاء المتابعة", noFollowing: "لم تقم بمتابعة أي بطولة بعد."
    },
    en: {
        live: "Live", matches: "Matches", news: "News", leagues: "Leagues", following: "Following", search: "Search",
        today: "Today", yesterday: "Yesterday", tomorrow: "Tomorrow", loadingMatches: "Fetching matches...",
        noMatches: "No matches on this date", noLiveMatches: "No live matches right now", loadingNews: "Fetching news...",
        topLeaguesNow: "Top Leagues", liveTransfers: "Transfers", topNews: "Latest Global News", topDeals: "Live Transfer News & Rumors",
        standings: "Standings", team: "Team", played: "P", gd: "GD", pts: "Pts",
        stats: "Stats", lineups: "Lineups", subs: "Substitutes", age: "Age", height: "Height",
        position: "Position", rating: "Rating", goals: "Goals", assists: "Assists", notStarted: "Scheduled", finished: "FT",
        loading: "Loading...", errorLoad: "Error loading database. Please try again.", noData: "Data unavailable", transfersWord: "Transfers",
        statsUnavailable: "Stats unavailable", lineupsUnavailable: "Lineups unavailable", standingsUnavailable: "Standings unavailable",
        close: "Close", todayBtn: "Today",
        sbAccount: "Account", sbMainScreen: "Main Screen", sbHome: "Choose Main Screen",
        sbNewsLeagues: "News & Leagues", sbAllLeagues: "All Leagues", sbSettings: "Settings",
        sbLanguage: "Language", sbNotifications: "Notifications",
        follow: "Follow", unfollow: "Unfollow", noFollowing: "You are not following any leagues yet."
    }
};

const ARABIC_DICTIONARY = {
    "World": "عالمي", "England": "إنجلترا", "Spain": "إسبانيا", "Italy": "إيطاليا", "Germany": "ألمانيا", "France": "فرنسا", "Portugal": "البرتغال", "Saudi Arabia": "السعودية", "USA": "أمريكا", "Turkey": "تركيا", "Cyprus": "قبرص", "Brazil": "البرازيل", "Egypt": "مصر", "Morocco": "المغرب",
    "Premier League": "الدوري الإنجليزي", "Championship": "دوري البطولة الإنجليزية", "La Liga": "الدوري الإسباني", "Serie A": "الدوري الإيطالي", "Bundesliga": "الدوري الألماني", "Ligue 1": "الدوري الفرنسي", "Primeira Liga": "الدوري البرتغالي", "UEFA Champions League": "دوري أبطال أوروبا", "UEFA Europa League": "الدوري الأوروبي", "Saudi Pro League": "الدوري السعودي", "AFC Champions League": "دوري أبطال آسيا", "Major League Soccer": "الدوري الأمريكي", "1. Division": "الدوري القبرصي", "1. Lig": "الدوري التركي الدرجة الأولى",
    "Arsenal": "أرسنال", "Aston Villa": "أستون فيلا", "Chelsea": "تشيلسي", "Liverpool": "ليفربول", "Manchester City": "مانشستر سيتي", "Manchester United": "مانشستر يونايتد", "Newcastle": "نيوكاسل", "Tottenham": "توتنهام", "Middlesbrough": "ميدلزبره", "Birmingham": "برمنغهام",
    "Real Madrid": "ريال مدريد", "Barcelona": "برشلونة", "Atletico Madrid": "أتلتيكو مدريد", "Sevilla": "إشبيلية", "Getafe": "خيتافي", "Valencia": "فالنسيا",
    "Juventus": "يوفنتوس", "AC Milan": "ميلان", "Inter": "إنتر ميلان", "Napoli": "نابولي", "AS Roma": "روما", "Bologna": "بولونيا", "Fiorentina": "فيورنتينا", "Pisa": "بيزا", "Udinese": "أودينيزي",
    "Inter Miami": "إنتر ميامي", "Orlando City SC": "أورلاندو سيتي", "San Diego": "سان دييغو", "St. Louis City": "سانت لويس سيتي", "Apollon Limassol": "أبولون ليماسول", "Omonia Nicosia": "أومونيا نيقوسيا", "Çorum FK": "كوروم", "Manisa F.K.": "مانيسا",
    "Al-Duhail SC": "الدحيل", "Al-Ahli Jeddah": "الأهلي السعودي", "Tractor Sazi": "تراكتور سازي", "Shabab Al Ahli Dubai": "شباب الأهلي دبي", "Al Hilal": "الهلال", "Al Nassr": "النصر"
};

const DYNAMIC_DICTIONARY_KEY = 'frsport_dynamic_dict';
let dynamicDictionary = JSON.parse(localStorage.getItem(DYNAMIC_DICTIONARY_KEY) || '{}');

async function fetchGoogleTranslation(text) {
    if (!text) return "";
    try {
        const WORKER_URL = "https://spring-dream-011d.farhad10180.workers.dev";
        const url = `${WORKER_URL}/translate?text=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.translatedText || text;
    } catch (e) {
        console.error("Worker Translation Error:", e);
        return text; 
    }
}

async function prepareTranslations(namesArray) {
    if (AppState.currentLang !== 'ar') return;
    let needsSave = false;
    const uniqueNames = [...new Set(namesArray)];
    const translationPromises = uniqueNames.map(async (name) => {
        if (name && !ARABIC_DICTIONARY[name] && !dynamicDictionary[name]) {
            const translated = await fetchGoogleTranslation(name);
            dynamicDictionary[name] = translated;
            needsSave = true;
        }
    });
    await Promise.all(translationPromises);
    if (needsSave) {
        localStorage.setItem(DYNAMIC_DICTIONARY_KEY, JSON.stringify(dynamicDictionary));
    }
}

function translateName(name) { 
    if(!name) return "";
    if (AppState.currentLang === 'ar') {
        return ARABIC_DICTIONARY[name] || dynamicDictionary[name] || name; 
    }
    return name; 
}

function isTranslated(name) {
    if (AppState.currentLang !== 'ar') return true;
    return !!(ARABIC_DICTIONARY[name] || dynamicDictionary[name]);
}

function observeTranslations() {
    if (AppState.currentLang !== 'ar') return;
    const observer = new IntersectionObserver((entries) => {
        const toFetch = entries.filter(e => e.isIntersecting).map(e => e.target);
        if (toFetch.length === 0) return;
        const names = [...new Set(toFetch.map(el => el.getAttribute('data-trans')))];
        toFetch.forEach(el => observer.unobserve(el));
        prepareTranslations(names).then(() => {
            toFetch.forEach(el => {
                const orig = el.getAttribute('data-trans');
                if (dynamicDictionary[orig] || ARABIC_DICTIONARY[orig]) {
                    el.textContent = translateName(orig);
                    el.removeAttribute('data-trans');
                    el.classList.remove('lazy-text');
                }
            });
        });
    }, { rootMargin: '100px' });
    document.querySelectorAll('.lazy-text').forEach(el => observer.observe(el));
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar || !overlay) return;
    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    } else {
        sidebar.classList.add('open');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}
window.toggleSidebar = toggleSidebar; 

const Utils = {
    formatDateLoc: (dateObj, offset) => {
        if (offset === 0) return UI_DICTIONARY[AppState.currentLang].today; 
        if (offset === -1) return UI_DICTIONARY[AppState.currentLang].yesterday; 
        if (offset === 1) return UI_DICTIONARY[AppState.currentLang].tomorrow;
        if (AppState.currentLang === 'ar') {
            const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
            const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
            return `${days[dateObj.getDay()]} ${dateObj.getDate()} ${months[dateObj.getMonth()]}`;
        } else {
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${days[dateObj.getDay()]} ${dateObj.getDate().toString().padStart(2, '0')} ${months[dateObj.getMonth()]}`;
        }
    },
    formatTimeLoc: (dateStr) => {
        if(!dateStr || !dateStr.includes('T')) return dateStr || '';
        const d = new Date(dateStr);
        let timeEn = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        if (AppState.currentLang === 'ar') {
            return timeEn.replace('AM', 'ص').replace('PM', 'م');
        }
        return timeEn;
    },
    isLiveMatch: (s) => CONFIG.LIVE_STATUSES.includes(s),
    isNotStarted: (s) => CONFIG.NOT_STARTED_STATUSES.includes(s),
    getCurrentSeason: () => {
        const d = new Date();
        return d.getMonth() < 6 ? d.getFullYear() - 1 : d.getFullYear();
    }
};

const TOP_LEAGUES = [
    { id: 39, nameAr: "الدوري الإنجليزي", nameEn: "Premier League", logo: "https://media.api-sports.io/football/leagues/39.png" },
    { id: 140, nameAr: "الدوري الإسباني", nameEn: "La Liga", logo: "https://media.api-sports.io/football/leagues/140.png" },
    { id: 135, nameAr: "الدوري الإيطالي", nameEn: "Serie A", logo: "https://media.api-sports.io/football/leagues/135.png" },
    { id: 78, nameAr: "الدوري الألماني", nameEn: "Bundesliga", logo: "https://media.api-sports.io/football/leagues/78.png" },
    { id: 61, nameAr: "الدوري الفرنسي", nameEn: "Ligue 1", logo: "https://media.api-sports.io/football/leagues/61.png" },
    { id: 2, nameAr: "دوري أبطال أوروبا", nameEn: "UEFA Champions League", logo: "https://media.api-sports.io/football/leagues/2.png" },
    { id: 307, nameAr: "الدوري السعودي", nameEn: "Saudi Pro League", logo: "https://media.api-sports.io/football/leagues/307.png" }
];

function toggleLanguageMenu() {
    const submenu = document.getElementById('language-submenu');
    submenu.classList.toggle('open');
    const chevron = document.getElementById('lang-chevron');
    if (submenu.classList.contains('open')) {
        chevron.style.transform = AppState.currentLang === 'ar' ? 'rotate(270deg)' : 'rotate(90deg)';
    } else {
        chevron.style.transform = AppState.currentLang === 'ar' ? 'rotate(0deg)' : 'rotate(180deg)';
    }
}
window.toggleLanguageMenu = toggleLanguageMenu;

function setLanguage(lang) {
    if (AppState.currentLang === lang) {
        toggleLanguageMenu();
        return; 
    }
    AppState.currentLang = lang;
    localStorage.setItem('frsport_lang', AppState.currentLang);
    document.getElementById('html-tag').setAttribute('dir', AppState.currentLang === 'ar' ? 'rtl' : 'ltr');
    document.getElementById('html-tag').setAttribute('lang', AppState.currentLang);
    updateUI();
    setupDatesBar();
    
    // Refresh current tab
    const activeTab = document.querySelector('.nav-item.active').getAttribute('data-tab');
    if (activeTab === 'matches') {
        if (AppState.globalMatches && AppState.globalMatches.length > 0) renderMatchesList(AppState.globalMatches);
        else fetchMatches(AppState.currentDate);
    } else if (activeTab === 'news') fetchNews();
    else if (activeTab === 'leagues') renderLeaguesTab();
    else if (activeTab === 'following') renderFollowingTab();

    toggleLanguageMenu();
    toggleSidebar();
}
window.setLanguage = setLanguage;

function updateUI() {
    const d = UI_DICTIONARY[AppState.currentLang];
    document.getElementById('text-live').innerText = d.live;
    document.getElementById('nav-matches').innerText = d.matches;
    document.getElementById('nav-news').innerText = d.news;
    document.getElementById('nav-leagues').innerText = d.leagues;
    document.getElementById('nav-following').innerText = d.following;
    document.getElementById('nav-search').innerText = d.search;
    if(document.getElementById('text-sb-account')) document.getElementById('text-sb-account').innerText = d.sbAccount;
    if(document.getElementById('text-sb-main-screen')) document.getElementById('text-sb-main-screen').innerText = d.sbMainScreen;
    if(document.getElementById('text-sb-home')) document.getElementById('text-sb-home').innerText = d.sbHome;
    if(document.getElementById('text-sb-news-leagues')) document.getElementById('text-sb-news-leagues').innerText = d.sbNewsLeagues;
    if(document.getElementById('text-sb-all-leagues')) document.getElementById('text-sb-all-leagues').innerText = d.sbAllLeagues;
    if(document.getElementById('text-sb-settings')) document.getElementById('text-sb-settings').innerText = d.sbSettings;
    if(document.getElementById('text-sb-language')) document.getElementById('text-sb-language').innerText = d.sbLanguage;
    if(document.getElementById('text-sb-notifications')) document.getElementById('text-sb-notifications').innerText = d.sbNotifications;
    const loadingMatches = document.getElementById('text-loading-matches');
    if(loadingMatches) loadingMatches.innerText = d.loadingMatches;
    const standingsTitle = document.getElementById('text-standings-title');
    if(standingsTitle) standingsTitle.innerText = d.standings;
    if(document.getElementById('text-cal-close')) document.getElementById('text-cal-close').innerText = d.close;
    if(document.getElementById('text-cal-today')) document.getElementById('text-cal-today').innerText = d.todayBtn;
}

function setupDatesBar() {
    const container = document.getElementById('dates-container');
    if (!container) return;
    const realTodayStr = new Date().toISOString().split('T')[0]; 
    const centerDateStr = AppState.currentDate || realTodayStr;
    const centerDate = new Date(centerDateStr);
    let html = ''; 
    for (let i = -7; i <= 7; i++) {
        let d = new Date(centerDate); 
        d.setDate(centerDate.getDate() + i);
        let month = String(d.getMonth() + 1).padStart(2, '0');
        let day = String(d.getDate()).padStart(2, '0');
        let dateStr = `${d.getFullYear()}-${month}-${day}`;
        let active = dateStr === centerDateStr ? "active" : "";
        let realTodayObj = new Date(realTodayStr);
        let diffTime = d.getTime() - realTodayObj.getTime();
        let diffDays = Math.round(diffTime / (1000 * 3600 * 24));
        let displayText = '';
        if (diffDays === 0) displayText = UI_DICTIONARY[AppState.currentLang].today;
        else if (diffDays === -1) displayText = UI_DICTIONARY[AppState.currentLang].yesterday;
        else if (diffDays === 1) displayText = UI_DICTIONARY[AppState.currentLang].tomorrow;
        else {
            if (AppState.currentLang === 'ar') {
                const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
                const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
                displayText = `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
            } else {
                const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                displayText = `${days[d.getDay()]} ${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]}`;
            }
        }
        html += `<div class="date-item ${active}" id="btn-${dateStr}" onclick="selectDate('${dateStr}')">${displayText}</div>`;
    }
    container.innerHTML = html;
    setTimeout(() => { document.querySelector('.date-item.active')?.scrollIntoView({ behavior: 'smooth', inline: 'center' }); }, 100);
}

function selectDate(dateStr) {
    if (AppState.currentDate === dateStr) return;
    AppState.currentDate = dateStr;
    setupDatesBar();
    const matchesTabBtn = document.querySelector('.nav-item[data-tab="matches"]');
    if(matchesTabBtn) switchTab(matchesTabBtn);
    fetchMatches(dateStr);
}
window.selectDate = selectDate;

// إضافة الحاويات الناقصة لتبويبات يتابع وبحث إذا لم تكن موجودة في HTML
function ensureTabContainersExist() {
    if(!document.getElementById('tab-following')) {
        const followingTab = document.createElement('main');
        followingTab.className = 'leagues-container hidden';
        followingTab.id = 'tab-following';
        followingTab.style.paddingTop = '15px';
        document.body.insertBefore(followingTab, document.querySelector('.bottom-nav'));
    }
    if(!document.getElementById('tab-search')) {
        const searchTab = document.createElement('main');
        searchTab.className = 'leagues-container hidden';
        searchTab.id = 'tab-search';
        searchTab.style.paddingTop = '15px';
        
        // بناء واجهة البحث
        const d = UI_DICTIONARY[AppState.currentLang] || UI_DICTIONARY['ar'];
        searchTab.innerHTML = `
            <div class="search-container">
                <div class="search-input-wrapper">
                    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input type="text" id="search-input" placeholder="${d.search}..." oninput="handleSearchInput(event)">
                </div>
            </div>
            <div id="search-results" class="leagues-grid" style="margin-top: 15px;">
                <div class="empty-msg">${AppState.currentLang === 'ar' ? 'ابحث عن فريقك المفضل...' : 'Search for your favorite team...'}</div>
            </div>
        `;
        document.body.insertBefore(searchTab, document.querySelector('.bottom-nav'));
    }
}

function switchTab(el) {
    ensureTabContainersExist();
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) toggleSidebar();
    
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    el.classList.add('active');
    
    ['tab-matches', 'tab-news', 'tab-leagues', 'tab-following', 'tab-search'].forEach(id => {
        const elem = document.getElementById(id);
        if(elem) elem.classList.add('hidden');
    });

    const tabData = el.getAttribute('data-tab');
    const datesWrapper = document.querySelector('.dates-wrapper');
    
    if(tabData === 'matches') {
        document.getElementById('tab-matches').classList.remove('hidden');
        datesWrapper.style.display = 'block'; 
    } else if(tabData === 'news') {
        document.getElementById('tab-news').classList.remove('hidden');
        datesWrapper.style.display = 'none'; 
        fetchNews();
    } else if(tabData === 'leagues') {
        document.getElementById('tab-leagues').classList.remove('hidden');
        datesWrapper.style.display = 'none'; 
        renderLeaguesTab(); 
    } else if(tabData === 'following') {
        document.getElementById('tab-following').classList.remove('hidden');
        datesWrapper.style.display = 'none'; 
        renderFollowingTab();
    } else if(tabData === 'search') {
        document.getElementById('tab-search').classList.remove('hidden');
        datesWrapper.style.display = 'none';
        // تفعيل التركيز على مربع البحث عند فتح التبويب
        setTimeout(() => {
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.focus();
        }, 100);
    }
}
window.switchTab = switchTab;

function toggleLive(btn) {
    btn.classList.toggle('active');
    AppState.isLiveMode = btn.classList.contains('active');
    renderMatchesList(AppState.globalMatches);
}
window.toggleLive = toggleLive;

// === نظام المتابعة (Firebase) ===
async function toggleFollowLeague(event, leagueId, nameAr, nameEn, logo) {
    event.stopPropagation(); // لمنع فتح ترتيب الدوري عند الضغط على النجمة
    const index = AppState.followingLeagues.findIndex(l => l.id === leagueId);
    if (index > -1) {
        AppState.followingLeagues.splice(index, 1);
        event.target.style.fill = 'none';
        event.target.style.stroke = 'var(--text-muted)';
    } else {
        AppState.followingLeagues.push({ id: leagueId, nameAr, nameEn, logo });
        event.target.style.fill = 'var(--accent-color)';
        event.target.style.stroke = 'var(--accent-color)';
    }

    // تحديث واجهة المتابعة إذا كنا فيها
    if (!document.getElementById('tab-following').classList.contains('hidden')) {
        renderFollowingTab();
    }

    // حفظ في Firebase
    try {
        await setDoc(doc(db, "users_following", userId), { leagues: AppState.followingLeagues }, { merge: true });
    } catch(e) { console.error("Firebase save error", e); }
}
window.toggleFollowLeague = toggleFollowLeague;

function renderLeaguesTab() {
    const container = document.getElementById('tab-leagues');
    if (!container) return;
    const d = UI_DICTIONARY[AppState.currentLang];
    let html = `<div class="trending-header" style="padding-top:0;">${d.topLeaguesNow}</div><div class="leagues-grid">`;
    
    TOP_LEAGUES.forEach(l => {
        let displayName = AppState.currentLang === 'ar' ? l.nameAr : l.nameEn;
        let isFollowed = AppState.followingLeagues.some(fl => fl.id === l.id);
        let starFill = isFollowed ? 'var(--accent-color)' : 'none';
        let starStroke = isFollowed ? 'var(--accent-color)' : 'var(--text-muted)';

        html += `
        <div class="league-card" onclick="openLeagueStandings(${l.id})">
            <img src="${l.logo}" class="league-card-logo">
            <div class="league-card-info">
                <div class="league-card-name">${displayName}</div>
            </div>
            <svg onclick="toggleFollowLeague(event, ${l.id}, '${l.nameAr}', '${l.nameEn}', '${l.logo}')" width="22" height="22" viewBox="0 0 24 24" fill="${starFill}" stroke="${starStroke}" stroke-width="2" style="cursor:pointer;">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
        </div>`;
    });
    container.innerHTML = html + `</div>`;
}

function renderFollowingTab() {
    const container = document.getElementById('tab-following');
    if (!container) return;
    const d = UI_DICTIONARY[AppState.currentLang];
    
    if (AppState.followingLeagues.length === 0) {
        container.innerHTML = `<div class="empty-msg" style="margin-top:50px;">${d.noFollowing}</div>`;
        return;
    }

    let html = `<div class="trending-header" style="padding-top:0;">${d.following}</div><div class="leagues-grid">`;
    AppState.followingLeagues.forEach(l => {
        let displayName = AppState.currentLang === 'ar' ? l.nameAr : l.nameEn;
        html += `
        <div class="league-card" onclick="openLeagueStandings(${l.id})">
            <img src="${l.logo}" class="league-card-logo">
            <div class="league-card-info">
                <div class="league-card-name">${displayName}</div>
            </div>
            <svg onclick="toggleFollowLeague(event, ${l.id}, '${l.nameAr}', '${l.nameEn}', '${l.logo}')" width="22" height="22" viewBox="0 0 24 24" fill="var(--accent-color)" stroke="var(--accent-color)" stroke-width="2" style="cursor:pointer;">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
        </div>`;
    });
    container.innerHTML = html + `</div>`;
}

async function fetchNews() {
    const container = document.getElementById('tab-news');
    if(!container) return;
    const d = UI_DICTIONARY[AppState.currentLang];
    const cacheKey = `frsport_news_cache_${AppState.currentLang}`;
    const cachedNews = localStorage.getItem(cacheKey);
    if (cachedNews) {
        container.innerHTML = cachedNews;
    } else {
        container.innerHTML = `<div class="loader" style="margin-top:50px; color:var(--accent-color);">${d.loadingNews}</div>`;
    }
    try {
        let normalizedArticles = [];
        let transferKeywords = [];
        if (AppState.currentLang === 'ar') {
            const arUrl1 = 'https://www.skynewsarabia.com/rss/sport';
            const arUrl2 = 'https://arabic.rt.com/rss/sport/';
            const [res1, res2] = await Promise.all([
                fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(arUrl1)}`),
                fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(arUrl2)}`)
            ]);
            const data1 = await res1.json(); const data2 = await res2.json();
            let allArArticles = [];
            if(data1.status === 'ok') allArArticles.push(...data1.items);
            if(data2.status === 'ok') allArArticles.push(...data2.items);
            allArArticles.forEach(a => {
                normalizedArticles.push({
                    title: a.title, link: a.link, pubDate: a.pubDate,
                    img: a.thumbnail || (a.enclosure ? a.enclosure.link : null),
                    source: a.link.includes('skynews') ? 'Sky News Arabia' : 'RT Sports'
                });
            });
            transferKeywords = ['انتقال', 'صفقة', 'تعاقد', 'توقيع', 'إعارة', 'رسميا', 'يضم', 'مفاوضات', 'عقد'];
        } 
        else {
            const eplUrl = 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news?limit=50';
            const laligaUrl = 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/news?limit=50';
            const [eplRes, laligaRes] = await Promise.all([ fetch(eplUrl), fetch(laligaUrl) ]);
            const eplData = await eplRes.json(); const laligaData = await laligaRes.json();
            let allEnArticles = [];
            if(eplData.articles) allEnArticles.push(...eplData.articles);
            if(laligaData.articles) allEnArticles.push(...laligaData.articles);
            allEnArticles.forEach(a => {
                normalizedArticles.push({
                    title: a.headline, link: a.links?.web?.href, pubDate: a.published,
                    img: a.images && a.images.length > 0 ? a.images[0].url : null,
                    source: 'ESPN FC'
                });
            });
            transferKeywords = ['transfer', 'sign', 'deal', 'loan', 'bid', 'contract', 'move', 'medical', 'agrees', 'swap'];
        }
        let uniqueArticles = []; let titles = new Set();
        normalizedArticles.forEach(a => { if(!titles.has(a.title)) { titles.add(a.title); uniqueArticles.push(a); } });
        uniqueArticles.sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate));
        if(uniqueArticles.length === 0) return;
        const transferArticles = uniqueArticles.filter(a => transferKeywords.some(kw => a.title.toLowerCase().includes(kw)));
        const defaultImg = 'https://images.unsplash.com/photo-1518605368461-1e1e38ce81c2?q=80&w=600&auto=format&fit=crop';
        let combinedHtml = `<div class="news-top-nav"><div class="news-top-tab active" onclick="switchNewsSubTab('foryou', this)">${d.topLeaguesNow}</div><div class="news-top-tab" onclick="switchNewsSubTab('transfers', this)">${d.liveTransfers}</div></div><div id="news-content-area">`;
        let forYouHtml = `<div id="news-foryou-content"><div class="trending-header">${d.topNews}</div><div class="news-feed">`;
        uniqueArticles.slice(0, 30).forEach((article, index) => {
            let img = article.img || defaultImg;
            let pDate = Utils.formatTimeLoc(article.pubDate);
            let alignClass = AppState.currentLang === 'ar' ? 'text-align:right; direction:rtl;' : 'text-align:left; direction:ltr;'; 
            if (index === 0) { 
                forYouHtml += `<div class="news-hero-card" onclick="window.open('${article.link}', '_blank')"><img src="${img}" class="news-hero-img" onerror="this.onerror=null; this.src='${defaultImg}'"><div class="news-hero-title" style="${alignClass}">${article.title}</div><div class="news-date" style="${alignClass} color:var(--accent-color);">${article.source} • ${pDate}</div></div>`; 
            } else { 
                forYouHtml += `<div class="news-list-card" onclick="window.open('${article.link}', '_blank')"><div class="news-list-content"><div class="news-list-title" style="${alignClass}">${article.title}</div><div class="news-date" style="${alignClass} color:var(--accent-color);">${article.source} • ${pDate}</div></div><img src="${img}" class="news-list-img" onerror="this.onerror=null; this.src='${defaultImg}'"></div>`; 
            }
        });
        forYouHtml += `</div></div>`;
        let transfersHtml = `<div id="news-transfers-content" class="hidden"><div class="trending-header" style="color:var(--accent-color);">${d.topDeals}</div><div class="news-feed">`;
        if (transferArticles.length > 0) {
            transferArticles.slice(0, 20).forEach(article => {
                let img = article.img || defaultImg;
                let pDate = Utils.formatTimeLoc(article.pubDate);
                let alignClass = AppState.currentLang === 'ar' ? 'text-align:right; direction:rtl;' : 'text-align:left; direction:ltr;';
                transfersHtml += `<div class="news-list-card" onclick="window.open('${article.link}', '_blank')"><div class="news-list-content"><div class="news-list-title" style="font-weight: 800; ${alignClass}">${article.title}</div><div class="news-date" style="${alignClass} color:var(--accent-color);">${d.transfersWord} • ${pDate}</div></div><img src="${img}" class="news-list-img" onerror="this.onerror=null; this.src='${defaultImg}'"></div>`;
            });
        } else { transfersHtml += `<div class="empty-msg">${d.noData}</div>`; }
        transfersHtml += `</div></div>`;
        combinedHtml += forYouHtml + transfersHtml + `</div>`;
        container.innerHTML = combinedHtml;
        localStorage.setItem(cacheKey, combinedHtml);
    } catch (e) { console.error("News sync failed", e); }
}

function switchNewsSubTab(tabId, el) {
    document.querySelectorAll('.news-top-tab').forEach(t => t.classList.remove('active'));
    if(el) el.classList.add('active');
    document.getElementById('news-foryou-content').classList.add('hidden');
    document.getElementById('news-transfers-content').classList.add('hidden');
    document.getElementById(`news-${tabId}-content`).classList.remove('hidden');
}
window.switchNewsSubTab = switchNewsSubTab;

function getLeaguePriority(league) {
    const id = league.id; const name = league.name ? league.name.toLowerCase() : '';
    if ([2, 3, 4, 1, 15, 17, 848, 9, 10].includes(id)) return 1;
    if ([39, 140, 135, 78, 61].includes(id)) return 2;
    if ([307, 253, 88, 94, 40, 41, 42].includes(id)) return 3;
    if (name.includes('u21') || name.includes('u20') || name.includes('u19') || name.includes('u17') || name.includes('women') || name.includes('friendlies') || name.includes('development') || name.includes('reserve') || name.includes('primavera') || name.includes('youth') || name.includes('paulista') || name.includes('carioca') || name.includes('division 2') || name.includes('division 3')) return 999;
    return 10;
}

async function fetchMatches(date) {
    AppState.currentDate = date;
    const container = document.getElementById('tab-matches');
    if (!container) return;
    const d = UI_DICTIONARY[AppState.currentLang];
    
    container.innerHTML = `<div class="loader">${d.loadingMatches}</div>`;
    
    try {
        const WORKER_URL = "https://spring-dream-011d.farhad10180.workers.dev";
        const targetUrl = `${WORKER_URL}/apifootball/fixtures?date=${date}`;
        
        const response = await fetch(targetUrl);
        const data = await response.json();
        
        let matches = [];
        
        if (data && data.response) {
            data.response.forEach(item => {
                matches.push({
                    fixture: {
                        id: item.fixture.id,
                        date: item.fixture.date,
                        status: { short: item.fixture.status.short, elapsed: item.fixture.status.elapsed || 0 }
                    },
                    league: {
                        id: item.league.id,
                        name: item.league.name,
                        country: item.league.country,
                        logo: item.league.logo
                    },
                    teams: {
                        home: { name: item.teams.home.name, logo: item.teams.home.logo },
                        away: { name: item.teams.away.name, logo: item.teams.away.logo }
                    },
                    goals: {
                        home: item.goals.home !== null ? item.goals.home : null,
                        away: item.goals.away !== null ? item.goals.away : null
                    }
                });
            });
        }

        AppState.globalMatches = matches;
        await renderMatchesList(matches);
        
    } catch (error) { 
        console.error("Fetch Error:", error);
        if(!container.innerHTML.includes('match-row')) {
            container.innerHTML = `<div class="empty-msg">${d.errorLoad}</div>`; 
        }
    }
}

async function renderMatchesList(matches) {
    const container = document.getElementById('tab-matches');
    const d = UI_DICTIONARY[AppState.currentLang];
    if (!matches || matches.length === 0) { 
        container.innerHTML = `<div class="empty-msg">${d.noMatches}</div>`; 
        return; 
    }
    const leaguesGroup = {};
    matches.forEach(m => {
        if (AppState.isLiveMode && !Utils.isLiveMatch(m.fixture.status.short)) return;
        const priority = getLeaguePriority(m.league);
        if (priority === 999) return; 
        if (priority === 10 && AppState.currentLang === 'ar') {
             const isT = isTranslated(m.league.name) || isTranslated(m.league.country);
             if (!isT) return; 
        }
        const lId = m.league.id;
        if (!leaguesGroup[lId]) { leaguesGroup[lId] = { info: m.league, games: [] }; }
        leaguesGroup[lId].games.push(m);
    });
    const sortedLeagues = Object.values(leaguesGroup).sort((a, b) => {
        let priorityA = getLeaguePriority(a.info); let priorityB = getLeaguePriority(b.info);
        if(priorityA !== priorityB) return priorityA - priorityB;
        return a.info.name.localeCompare(b.info.name);
    });
    if (sortedLeagues.length === 0) { 
        container.innerHTML = `<div class="empty-msg">${d.noLiveMatches}</div>`; 
        return; 
    }
    let html = '';
    sortedLeagues.forEach(group => {
        const tLeagueName = translateName(group.info.name);
        const tCountry = translateName(group.info.country); 
        const attrL = !isTranslated(group.info.name) ? `data-trans="${group.info.name}" class="league-name lazy-text"` : `class="league-name"`;
        const attrC = !isTranslated(group.info.country) ? `data-trans="${group.info.country}" class="lazy-text"` : ``;
        html += `<div class="league-group"><div class="league-header" onclick="openLeagueStandings(${group.info.id})"><div class="league-title-wrapper"><img src="${group.info.logo}" class="league-logo"><span ${attrL}><span ${attrC}>${tCountry}</span> - ${tLeagueName}</span></div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg></div>`;
        group.games.forEach(m => {
            const s = m.fixture.status.short;
            let hG = m.goals.home !== null ? m.goals.home : '';
            let aG = m.goals.away !== null ? m.goals.away : '';
            let center = '';
            if (Utils.isNotStarted(s)) {
                center = `<div class="match-center" style="direction:ltr; font-size:9px;">${Utils.formatTimeLoc(m.fixture.date)}</div>`;
            } else if (Utils.isLiveMatch(s)) {
                center = `<div class="match-center live" style="font-size:9px;"><span style="font-size:8px;">${m.fixture.status.elapsed}'</span><br>${hG} - ${aG}</div>`;
            } else { center = `<div class="match-center" style="font-size:9px;">${hG} - ${aG}</div>`; }
            const tHome = translateName(m.teams.home.name);
            const tAway = translateName(m.teams.away.name);
            const attrH = !isTranslated(m.teams.home.name) ? `data-trans="${m.teams.home.name}" class="team-name home-name lazy-text"` : `class="team-name home-name"`;
            const attrA = !isTranslated(m.teams.away.name) ? `data-trans="${m.teams.away.name}" class="team-name away-name lazy-text"` : `class="team-name away-name"`;
            html += `<div class="match-row" onclick="openMatchDetails('${m.fixture.id}')"><div class="match-teams-score"><span ${attrH}>${tHome}</span><img src="${m.teams.home.logo}" class="team-logo">${center}<img src="${m.teams.away.logo}" class="team-logo"><span ${attrA}>${tAway}</span></div></div>`;
        });
        html += `</div>`;
    });
    container.innerHTML = html;
    observeTranslations();
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
window.closeModal = closeModal;

function switchModalTab(tab) { 
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); 
    document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.add('hidden')); 
    event.target.classList.add('active'); 
    document.getElementById(`modal-${tab}`).classList.remove('hidden'); 
}
window.switchModalTab = switchModalTab;

// === تكامل API-Football لجلب الترتيب ===
async function openLeagueStandings(leagueId) {
    const modal = document.getElementById('standings-modal');
    const container = document.getElementById('standings-container');
    const d = UI_DICTIONARY[AppState.currentLang];
    modal.classList.remove('hidden');
    container.innerHTML = `<div class="loader" style="margin-top:50px;">${d.loading}</div>`;

    try {
        const WORKER_URL = "https://spring-dream-011d.farhad10180.workers.dev";
        const season = Utils.getCurrentSeason(); 
        const targetUrl = `${WORKER_URL}/apifootball/standings?league=${leagueId}&season=${season}`;
        
        const response = await fetch(targetUrl);
        const data = await response.json();

        if (data && data.response && data.response.length > 0) {
            const standings = data.response[0].league.standings[0];
            let html = `
                <div class="standings-table">
                    <div class="st-header">
                        <div class="st-rank">#</div>
                        <div class="st-team">${d.team}</div>
                        <div class="st-p">${d.played}</div>
                        <div class="st-gd">${d.gd}</div>
                        <div class="st-pts">${d.pts}</div>
                    </div>`;
            
            standings.forEach(row => {
                const tName = translateName(row.team.name);
                const attrT = !isTranslated(row.team.name) ? `data-trans="${row.team.name}" class="lazy-text"` : ``;
                html += `
                    <div class="st-row">
                        <div class="st-rank">${row.rank}</div>
                        <div class="st-team">
                            <img src="${row.team.logo}">
                            <span ${attrT}>${tName}</span>
                        </div>
                        <div class="st-p">${row.all.played}</div>
                        <div class="st-gd">${row.goalsDiff}</div>
                        <div class="st-pts">${row.points}</div>
                    </div>`;
            });
            html += `</div>`;
            container.innerHTML = html;
            observeTranslations();
        } else {
            container.innerHTML = `<div class="empty-msg">${d.noData}</div>`;
        }
    } catch (e) {
        container.innerHTML = `<div class="empty-msg">${d.errorLoad}</div>`;
    }
}
window.openLeagueStandings = openLeagueStandings;

function buildPitchHtml(teamLineup, teamInfo) {
    if (!teamLineup || !teamLineup.startXI || teamLineup.startXI.length === 0) return '';
    const translatedTeamName = translateName(teamInfo.name);
    let html = `<div class="pitch-wrapper"><div class="pitch-header"><div class="pitch-team"><img src="${teamInfo.logo}">${translatedTeamName}</div><div class="pitch-formation">${teamLineup.formation || ''}</div></div><div class="pitch">`;
    const rows = {};
    teamLineup.startXI.forEach(item => { let gridParts = item.player.grid ? item.player.grid.split(':') : []; let rowNum = gridParts.length > 0 ? parseInt(gridParts[0]) : 1; if(!rows[rowNum]) rows[rowNum] = []; rows[rowNum].push(item.player); });
    Object.keys(rows).sort((a,b)=>a-b).forEach(key => {
        html += `<div class="pitch-row">`;
        rows[key].sort((a,b) => (a.grid ? parseInt(a.grid.split(':')[1]) : 0) - (b.grid ? parseInt(b.grid.split(':')[1]) : 0)).forEach(p => {
            html += `<div class="pitch-player" onclick="openPlayerDetails('${p.id}')"><div class="pitch-player-img-wrapper"><img src="https://media.api-sports.io/football/players/${p.id}.png" class="pitch-player-img" onerror="this.onerror=null; this.src='https://cdn-icons-png.flaticon.com/512/3281/3281142.png'; this.style.backgroundColor='#111';"><div class="pitch-player-num">${p.number || ''}</div></div><div class="pitch-player-name">${p.name.split(' ').pop()}</div></div>`;
        });
        html += `</div>`;
    });
    return html + `</div></div>`;
}

// === تكامل API-Football لجلب تفاصيل المباراة ===
async function openMatchDetails(id) {
    const modal = document.getElementById('match-modal');
    const container = document.getElementById('match-info-container');
    const d = UI_DICTIONARY[AppState.currentLang];
    modal.classList.remove('hidden');
    container.innerHTML = `<div class="loader" style="margin-top:50px;">${d.loading}</div>`;
    
    try {
        const WORKER_URL = "https://spring-dream-011d.farhad10180.workers.dev";
        const targetUrl = `${WORKER_URL}/apifootball/fixtures?id=${id}`;
        
        const response = await fetch(targetUrl);
        const data = await response.json();
        
        if (data && data.response && data.response.length > 0) {
            const item = data.response[0];
            await prepareTranslations([item.teams.home.name, item.teams.away.name]);
            renderMatchDetailsModal(item, container);
        } else {
            throw new Error("Match not found");
        }
    } catch (e) { 
        container.innerHTML = `<div class="empty-msg">${d.errorLoad}</div>`; 
    }
}
window.openMatchDetails = openMatchDetails;

function renderMatchDetailsModal(item, container) {
    if(!item) return;
    const d = UI_DICTIONARY[AppState.currentLang];
    let s = item.fixture.status.short;
    let score = Utils.isNotStarted(s) ? Utils.formatTimeLoc(item.fixture.date) : `${item.goals.home ?? 0} - ${item.goals.away ?? 0}`;
    let sub = Utils.isNotStarted(s) ? d.notStarted : Utils.isLiveMatch(s) ? `<span style="color:var(--accent-color)">${item.fixture.status.elapsed}'</span>` : d.finished;
    
    let html = `
        <div class="match-hero">
            <div class="hero-team"><img src="${item.teams.home.logo}"><span class="p-name">${translateName(item.teams.home.name)}</span></div>
            <div class="hero-score-time">
                <div class="hero-score" style="direction:ltr; font-size:24px;">${score}</div>
                <div class="hero-sub">${sub}</div>
            </div>
            <div class="hero-team"><img src="${item.teams.away.logo}"><span class="p-name">${translateName(item.teams.away.name)}</span></div>
        </div>
        <div class="tabs-container">
            <div class="tab-btn active" onclick="switchModalTab('stats')">${d.stats}</div>
            <div class="tab-btn" onclick="switchModalTab('lineups')">${d.lineups}</div>
        </div>`;
    
    let statsHtml = `<div id="modal-stats" class="modal-tab-content">`;
    if (item.statistics && item.statistics.length === 2) {
        const homeStats = item.statistics[0].statistics;
        const awayStats = item.statistics[1].statistics;
        for (let i = 0; i < homeStats.length; i++) {
            let statName = homeStats[i].type;
            let hVal = homeStats[i].value === null ? 0 : String(homeStats[i].value).replace('%', '');
            let aVal = awayStats[i].value === null ? 0 : String(awayStats[i].value).replace('%', '');
            let total = Number(hVal) + Number(aVal);
            let hPct = total === 0 ? 50 : (Number(hVal) / total) * 100;
            let aPct = total === 0 ? 50 : (Number(aVal) / total) * 100;

            statsHtml += `
                <div class="stat-row">
                    <div class="stat-header">
                        <span>${hVal}</span>
                        <span style="color:var(--text-muted); font-size:11px;">${statName}</span>
                        <span>${aVal}</span>
                    </div>
                    <div class="stat-bar-container">
                        <div class="stat-bar-home" style="width:${hPct}%"></div>
                        <div class="stat-bar-away" style="width:${aPct}%"></div>
                    </div>
                </div>`;
        }
    } else {
        statsHtml += `<div class="empty-msg">${d.statsUnavailable}</div>`;
    }
    statsHtml += `</div>`;

    let lineupsHtml = `<div id="modal-lineups" class="modal-tab-content hidden">`;
    if (item.lineups && item.lineups.length === 2) {
        lineupsHtml += buildPitchHtml(item.lineups[0], item.teams.home);
        lineupsHtml += buildPitchHtml(item.lineups[1], item.teams.away);
    } else {
        lineupsHtml += `<div class="empty-msg">${d.lineupsUnavailable}</div>`;
    }
    lineupsHtml += `</div>`;
    
    container.innerHTML = html + statsHtml + lineupsHtml;
    observeTranslations();
}

// === تكامل API-Football لجلب تفاصيل اللاعبين ===
async function openPlayerDetails(playerId) {
    const modal = document.getElementById('player-modal');
    const container = document.getElementById('player-info-container');
    const d = UI_DICTIONARY[AppState.currentLang];
    modal.classList.remove('hidden');
    container.innerHTML = `<div class="loader" style="margin-top:50px;">${d.loading}</div>`;

    try {
        const WORKER_URL = "https://spring-dream-011d.farhad10180.workers.dev";
        const season = Utils.getCurrentSeason(); 
        const targetUrl = `${WORKER_URL}/apifootball/players?id=${playerId}&season=${season}`;
        
        const response = await fetch(targetUrl);
        const data = await response.json();

        if (data && data.response && data.response.length > 0) {
            const p = data.response[0].player;
            const stat = data.response[0].statistics[0]; 
            
            let html = `
                <div class="player-hero">
                    <img src="${p.photo}" class="player-photo-large" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3281/3281142.png'">
                    <div class="player-name-large">${p.name}</div>
                    <div class="player-team-info">
                        <img src="${stat.team.logo}" style="width:20px;">
                        <span>${translateName(stat.team.name)}</span>
                    </div>
                </div>
                <div class="player-stats-grid">
                    <div class="p-stat-box"><div class="p-stat-title">${d.age}</div><div class="p-stat-value">${p.age || '-'}</div></div>
                    <div class="p-stat-box"><div class="p-stat-title">${d.position}</div><div class="p-stat-value">${stat.games.position || '-'}</div></div>
                    <div class="p-stat-box"><div class="p-stat-title">${d.rating}</div><div class="p-stat-value">${stat.games.rating ? parseFloat(stat.games.rating).toFixed(1) : '-'}</div></div>
                    <div class="p-stat-box"><div class="p-stat-title">${d.goals}</div><div class="p-stat-value">${stat.goals.total || 0}</div></div>
                    <div class="p-stat-box"><div class="p-stat-title">${d.assists}</div><div class="p-stat-value">${stat.goals.assists || 0}</div></div>
                </div>
            `;
            container.innerHTML = html;
        } else {
            container.innerHTML = `<div class="empty-msg">${d.noData}</div>`;
        }
    } catch (e) {
        container.innerHTML = `<div class="empty-msg">${d.errorLoad}</div>`;
    }
}
window.openPlayerDetails = openPlayerDetails;

document.getElementById('html-tag').setAttribute('dir', AppState.currentLang === 'ar' ? 'rtl' : 'ltr');
document.getElementById('html-tag').setAttribute('lang', AppState.currentLang);
ensureTabContainersExist();
updateUI();
setupDatesBar();
if (!AppState.currentDate) {
    const today = new Date().toISOString().split('T')[0];
    fetchMatches(today);
}

const getLocalYYYYMMDD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function renderCustomCalendar() {
    const body = document.getElementById('calendar-body-scroll');
    const weekdays = document.getElementById('calendar-weekdays-container');
    const isAr = AppState.currentLang === 'ar';
    const names = isAr ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    weekdays.innerHTML = names.map(d => `<div>${d}</div>`).join('');
    let html = '';
    const realToday = new Date();
    const todayStr = getLocalYYYYMMDD(realToday);
    const selected = AppState.currentDate || todayStr;
    for(let i = -1; i <= 4; i++) {
        let currentMonth = new Date(realToday.getFullYear(), realToday.getMonth() + i, 1);
        html += `<div class="cal-month-title">${currentMonth.toLocaleString(isAr ? 'ar' : 'en-US', { month: 'long' })}</div><div class="cal-grid">`;
        let start = currentMonth.getDay();
        let count = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        for(let j = 0; j < start; j++) html += `<div class="cal-day empty"></div>`;
        for(let day = 1; day <= count; day++) {
            let loopDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            let loopStr = getLocalYYYYMMDD(loopDate);
            let classes = 'cal-day' + (loopStr === selected ? ' selected' : (loopStr === todayStr ? ' today' : ''));
            html += `<div class="${classes}" onclick="selectDateFromCalendar('${loopStr}')">${day}</div>`;
        }
        html += `</div>`;
    }
    body.innerHTML = html;
    setTimeout(() => {
        const sel = document.querySelector('.cal-day.selected') || document.querySelector('.cal-day.today');
        if(sel) sel.scrollIntoView({ behavior: 'auto', block: 'center' });
    }, 50);
}

function openCalendarModal() {
    renderCustomCalendar();
    document.getElementById('calendar-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
window.openCalendarModal = openCalendarModal;

function closeCalendarModal() {
    document.getElementById('calendar-modal').classList.add('hidden');
    document.body.style.overflow = '';
}
window.closeCalendarModal = closeCalendarModal;

function selectDateFromCalendar(dateStr) {
    closeCalendarModal();
    selectDate(dateStr); 
}
window.selectDateFromCalendar = selectDateFromCalendar;

function selectTodayFromCalendar() {
    selectDateFromCalendar(getLocalYYYYMMDD(new Date()));
}
window.selectTodayFromCalendar = selectTodayFromCalendar;

// === نظام البحث عن الفرق ===
let searchTimeout;

function handleSearchInput(event) {
    const query = event.target.value.trim();
    const resultsContainer = document.getElementById('search-results');
    const d = UI_DICTIONARY[AppState.currentLang];

    // إلغاء أي طلب بحث سابق إذا كان المستخدم لا يزال يكتب (Debounce)
    clearTimeout(searchTimeout);

    if (query.length < 3) {
        resultsContainer.innerHTML = `<div class="empty-msg">${AppState.currentLang === 'ar' ? 'أدخل 3 أحرف على الأقل للبحث...' : 'Enter at least 3 characters...'}</div>`;
        return;
    }

    // إظهار علامة التحميل
    resultsContainer.innerHTML = `<div class="loader" style="margin-top:30px; color:var(--accent-color);">${d.loading}</div>`;

    // الانتظار ثانية واحدة بعد توقف المستخدم عن الكتابة قبل إرسال الطلب للسيرفر
    searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 800); 
}
window.handleSearchInput = handleSearchInput;

async function performSearch(query) {
    const resultsContainer = document.getElementById('search-results');
    const d = UI_DICTIONARY[AppState.currentLang];
    
    try {
        const WORKER_URL = "https://spring-dream-011d.farhad10180.workers.dev";
        // استخدام مسار البحث عن الفرق في API-Football
        const targetUrl = `${WORKER_URL}/apifootball/teams?search=${encodeURIComponent(query)}`;
        
        const response = await fetch(targetUrl);
        const data = await response.json();
        
        if (data && data.response && data.response.length > 0) {
            let html = '';
            // نأخذ أول 10 نتائج فقط لتسريع العرض
            const teams = data.response.slice(0, 10);
            
            // استخراج الأسماء لترجمتها وتجهيزها في الذاكرة أولاً
            const namesToTranslate = [];
            teams.forEach(item => {
                namesToTranslate.push(item.team.name);
                namesToTranslate.push(item.team.country);
            });
            await prepareTranslations(namesToTranslate);

            // رسم النتائج
            teams.forEach(item => {
                const t = item.team;
                const tName = translateName(t.name);
                const tCountry = translateName(t.country);
                
                // يمكنك لاحقاً برمجة هذه الضغطة لفتح صفحة مخصصة للفريق، حالياً ستعطي تنبيهاً بسيطاً
                html += `
                <div class="search-result-card" onclick="alert('${AppState.currentLang === 'ar' ? 'قريباً: صفحة تفاصيل فريق' : 'Coming soon: Team details for'} ${tName}!')">
                    <img src="${t.logo}" class="search-result-logo" onerror="this.src='https://cdn-icons-png.flaticon.com/512/8812/8812061.png'">
                    <div class="search-result-info">
                        <div class="search-result-name">${tName}</div>
                        <div class="search-result-country">${tCountry}</div>
                    </div>
                </div>`;
            });
            
            resultsContainer.innerHTML = html;
        } else {
            resultsContainer.innerHTML = `<div class="empty-msg">${d.noData}</div>`;
        }
    } catch (e) {
        console.error("Search Error:", e);
        resultsContainer.innerHTML = `<div class="empty-msg">${d.errorLoad}</div>`;
    }
}
window.performSearch = performSearch;

// === نظام شاشة البداية (Splash Screen) ===
window.addEventListener('load', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('hidden-splash');
            setTimeout(() => {
                splash.remove();
            }, 500); // حذف الشاشة من الكود بعد اختفائها لتخفيف الذاكرة
        }
    }, 2000); // 2000 تعني أن الشاشة ستبقى ثانيتين (يمكنك زيادتها أو تقليلها)
});
