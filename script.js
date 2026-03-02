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
        // إذا لم تبدأ المباراة ولا توجد تشكيلة، نظهر شاشة الانتظار الأنيقة
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
            lineupsHtml += buildPlayerRow(hP, aP); // استخدمنا نفس دالة الصور للمصابين أيضاً
        }
        lineupsHtml += `</div>`;
    }
    lineupsHtml += '</div>';

    container.innerHTML = html + previewHtml + statsHtml + lineupsHtml;
}

// === الدالة المعدلة لإضافة الصور للاحتياط والمصابين ===
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
