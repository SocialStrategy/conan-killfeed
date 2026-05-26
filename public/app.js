(function () {
  'use strict';

  const KILL_VERBS = {
    Combat: ['slaughtered', 'cut down', 'executed', 'destroyed', 'butchered'],
    Poison: ['poisoned', 'corrupted', 'tainted the blood of'],
    Fatality: ['obliterated', 'annihilated', 'ended'],
    Fall: ['sent tumbling to their doom', 'pushed off the edge'],
    default: ['killed', 'slew', 'dispatched']
  };

  function pickVerb(cause) {
    const list = KILL_VERBS[cause] || KILL_VERBS.default;
    return list[Math.floor(Math.random() * list.length)];
  }

  function formatTimestamp(ts) {
    // "2026.05.26-17.43.00:000" -> Date
    const match = ts.match(/(\d{4})\.(\d{2})\.(\d{2})-(\d{2})\.(\d{2})\.(\d{2})/);
    if (!match) return ts;
    const d = new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6]);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'moments ago';
    if (diffMin < 60) return diffMin + 'm ago';
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return diffH + 'h ago';
    const diffD = Math.floor(diffH / 24);
    return diffD + 'd ago';
  }

  function buildChampions(players) {
    const row = document.getElementById('champions-row');
    row.innerHTML = '';
    const top3 = players.slice(0, 3);
    const icons = [
      '<span class="crown-icon"></span>',
      '<span class="shield-icon"></span>',
      '<span class="axe-icon"></span>'
    ];
    const labels = ['Champion', 'Warlord', 'Berserker'];

    top3.forEach(function (p, i) {
      var rank = i + 1;
      var card = document.createElement('div');
      card.className = 'champion-card rank-' + rank;
      card.innerHTML =
        '<div class="champion-icon">' + icons[i] + '</div>' +
        '<div class="champion-rank">' + labels[i] + '</div>' +
        '<div class="champion-name">' + esc(p.player) + '</div>' +
        '<div class="champion-clan">' + (p.clan ? esc(p.clan) : 'Lone Wolf') + '</div>' +
        '<div class="champion-stats">' +
          '<div class="champion-stat"><span class="champion-stat-val">' + p.kills + '</span><span class="champion-stat-label">Kills</span></div>' +
          '<div class="champion-stat"><span class="champion-stat-val">' + p.deaths + '</span><span class="champion-stat-label">Deaths</span></div>' +
          '<div class="champion-stat"><span class="champion-stat-val">' + p.kd.toFixed(2) + '</span><span class="champion-stat-label">K/D</span></div>' +
        '</div>';
      row.appendChild(card);
    });
  }

  function buildClanWars(players) {
    var clans = {};
    players.forEach(function (p) {
      var name = p.clan || '__exile__';
      if (!clans[name]) clans[name] = { kills: 0, deaths: 0, members: 0 };
      clans[name].kills += p.kills;
      clans[name].deaths += p.deaths;
      clans[name].members += 1;
    });

    var sorted = Object.keys(clans).map(function (name) {
      var c = clans[name];
      return {
        name: name,
        kills: c.kills,
        deaths: c.deaths,
        members: c.members,
        kd: c.deaths > 0 ? c.kills / c.deaths : c.kills,
        isExile: name === '__exile__'
      };
    });

    // Sort: exiles always last, others by kills desc
    sorted.sort(function (a, b) {
      if (a.isExile && !b.isExile) return 1;
      if (!a.isExile && b.isExile) return -1;
      return b.kills - a.kills;
    });

    var wrap = document.getElementById('clan-cards');
    wrap.innerHTML = '';

    // Limit to top 10 clans
    var limited = sorted.slice(0, 10);
    var rank = 0;
    limited.forEach(function (c) {
      if (!c.isExile) rank++;
      var currentRank = c.isExile ? 0 : rank;
      var card = document.createElement('div');
      var classes = 'clan-card';
      if (currentRank === 1) classes += ' clan-rank-1';
      if (c.isExile) classes += ' clan-exile';
      card.className = classes;

      var displayName = c.isExile ? 'Lone Wolves' : c.name;
      var rankDisplay = c.isExile
        ? '<div class="clan-banner"></div>'
        : '<span class="clan-rank-num">' + currentRank + '</span>';

      card.innerHTML =
        '<div class="clan-rank-col">' + rankDisplay + '</div>' +
        '<div class="clan-info">' +
          '<div class="clan-name">' + esc(displayName) + '</div>' +
          '<div class="clan-members-label">' + c.members + ' warrior' + (c.members !== 1 ? 's' : '') + '</div>' +
        '</div>' +
        '<div class="clan-stats">' +
          '<div class="clan-stat"><span class="clan-stat-val">' + c.kills + '</span><span class="clan-stat-label">Kills</span></div>' +
          '<div class="clan-stat"><span class="clan-stat-val">' + c.deaths + '</span><span class="clan-stat-label">Deaths</span></div>' +
          '<div class="clan-stat"><span class="clan-stat-val">' + c.kd.toFixed(2) + '</span><span class="clan-stat-label">K/D</span></div>' +
        '</div>';

      wrap.appendChild(card);
    });
  }

  function buildTable(players) {
    var tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    players.forEach(function (p) {
      var tr = document.createElement('tr');
      var rankClass = 'lb-rank';
      if (p.rank <= 3) rankClass += ' lb-rank-' + p.rank;
      var clanClass = p.clan ? 'lb-clan' : 'lb-clan no-clan';
      var kdClass = p.kd < 1 ? 'lb-stat lb-kd kd-low' : 'lb-stat lb-kd';

      tr.innerHTML =
        '<td class="' + rankClass + '">' + p.rank + '</td>' +
        '<td class="lb-player">' + esc(p.player) + '</td>' +
        '<td class="' + clanClass + '">' + (p.clan ? esc(p.clan) : 'None') + '</td>' +
        '<td class="lb-stat lb-kills">' + p.kills + '</td>' +
        '<td class="lb-stat">' + p.deaths + '</td>' +
        '<td class="' + kdClass + '">' + p.kd.toFixed(2) + '</td>';
      tbody.appendChild(tr);
    });
  }

  function buildKillfeed(kills, season) {
    var wrap = document.getElementById('killfeed');
    wrap.innerHTML = '';
    var filtered = kills.filter(function (k) { return k.season === season; });
    filtered.forEach(function (k) {
      var entry = document.createElement('div');
      entry.className = 'kill-entry';

      var killerClan = k.killer_clan ? ' <span class="kill-clan-tag">[' + esc(k.killer_clan) + ']</span>' : '';
      var victimClan = k.victim_clan ? ' <span class="kill-clan-tag">[' + esc(k.victim_clan) + ']</span>' : '';
      var verb = pickVerb(k.cause);

      entry.innerHTML =
        '<span class="kill-killer">' + esc(k.killer) + '</span>' + killerClan +
        ' <span class="kill-verb">' + verb + '</span> ' +
        '<span class="kill-victim">' + esc(k.victim) + '</span>' + victimClan +
        '<span class="kill-time">' + formatTimestamp(k.timestamp) + '</span>';
      wrap.appendChild(entry);
    });
  }

  function tugBar(pct, leftDominant) {
    // pct = left side percentage (0-100)
    var leftClass = 'tug-bar-left' + (leftDominant ? ' dominant' : '');
    var rightClass = 'tug-bar-right' + (!leftDominant ? ' dominant' : '');
    var rightPct = 100 - pct;
    return '<div class="tug-bar-wrap">' +
      '<div class="' + leftClass + '" style="width:' + pct + '%"></div>' +
      '<div class="' + rightClass + '" style="width:' + rightPct + '%"></div>' +
      '</div>';
  }

  function buildClanRivalries(data, season) {
    var wrap = document.getElementById('clan-rivalries');
    if (!wrap) return;
    wrap.innerHTML = '';
    var rivalries = (data.clan_rivalries && data.clan_rivalries[season]) || [];
    if (!rivalries.length) {
      wrap.innerHTML = '<p style="text-align:center;color:var(--text-dim);font-style:italic;padding:20px;">No clan rivalries recorded yet.</p>';
      return;
    }
    // Sort by total descending, limit to top 5 with at least 3 total kills
    var sorted = rivalries.slice()
      .filter(function (r) { return r.total >= 3; })
      .sort(function (a, b) { return b.total - a.total; })
      .slice(0, 5);
    if (sorted.length === 0) {
      wrap.innerHTML = '<p style="text-align:center;color:var(--text-dim);font-style:italic;padding:20px;">Not enough blood spilled between clans yet.</p>';
      return;
    }
    sorted.forEach(function (r, i) {
      var total = r.c1_kills + r.c2_kills;
      var leftPct = total > 0 ? Math.round((r.c1_kills / total) * 100) : 50;
      var leftDominant = r.c1_kills >= r.c2_kills;
      var card = document.createElement('div');
      card.className = 'clan-versus-card' + (i === 0 ? ' top-rivalry' : '');
      card.innerHTML =
        '<div class="clan-versus-header">' +
          '<div class="clan-versus-side side-left">' +
            '<div class="clan-versus-name">' + esc(r.clan1) + '</div>' +
            '<div class="clan-versus-kills' + (leftDominant ? ' dominant' : '') + '">' + r.c1_kills + '</div>' +
          '</div>' +
          '<div class="clan-versus-badge">VS</div>' +
          '<div class="clan-versus-side side-right">' +
            '<div class="clan-versus-name">' + esc(r.clan2) + '</div>' +
            '<div class="clan-versus-kills' + (!leftDominant ? ' dominant' : '') + '">' + r.c2_kills + '</div>' +
          '</div>' +
        '</div>' +
        tugBar(leftPct, leftDominant) +
        '<div class="tug-bar-total">' + total + ' TOTAL KILLS</div>';
      wrap.appendChild(card);
    });
  }

  function buildBloodFeuds(data, season) {
    var rivalries = (data.rivalries && data.rivalries[season]) || [];
    var players = data.seasons[season] || [];

    // Populate dropdowns
    var sel1 = document.getElementById('feud-player1');
    var sel2 = document.getElementById('feud-player2');
    if (!sel1 || !sel2) return;

    // Save current selections before rebuild
    var prev1 = sel1.value;
    var prev2 = sel2.value;

    sel1.innerHTML = '<option value="">Select...</option>';
    sel2.innerHTML = '<option value="">Select...</option>';

    var playerNames = players.map(function (p) { return p.player; });
    playerNames.forEach(function (name) {
      var o1 = document.createElement('option');
      o1.value = name; o1.textContent = name;
      if (name === prev1) o1.selected = true;
      sel1.appendChild(o1);

      var o2 = document.createElement('option');
      o2.value = name; o2.textContent = name;
      if (name === prev2) o2.selected = true;
      sel2.appendChild(o2);
    });

    function renderFeudResult() {
      var n1 = sel1.value;
      var n2 = sel2.value;
      var result = document.getElementById('feud-result');
      if (!result) return;
      if (!n1 || !n2 || n1 === n2) {
        result.innerHTML = '';
        return;
      }
      // Find a rivalry entry matching these two players (either order)
      var match = null;
      var flipped = false;
      rivalries.forEach(function (r) {
        if (r.player1 === n1 && r.player2 === n2) { match = r; flipped = false; }
        else if (r.player1 === n2 && r.player2 === n1) { match = r; flipped = true; }
      });

      if (!match) {
        result.innerHTML = '<div class="feud-no-data">No recorded encounters between these warriors.</div>';
        return;
      }

      var p1 = flipped ? match.player2 : match.player1;
      var p2 = flipped ? match.player1 : match.player2;
      var k1 = flipped ? match.p2_kills : match.p1_kills;
      var k2 = flipped ? match.p1_kills : match.p2_kills;
      var c1 = flipped ? match.p2_clan : match.p1_clan;
      var c2 = flipped ? match.p1_clan : match.p2_clan;
      var total = k1 + k2;
      var leftPct = total > 0 ? Math.round((k1 / total) * 100) : 50;
      var leftDom = k1 >= k2;

      var p1Info = players.filter(function (p) { return p.player === p1; })[0];
      var p2Info = players.filter(function (p) { return p.player === p2; })[0];
      var clan1 = (p1Info && p1Info.clan) || c1 || 'Lone Wolf';
      var clan2 = (p2Info && p2Info.clan) || c2 || 'Lone Wolf';

      result.innerHTML =
        '<div class="feud-versus-card">' +
          '<div class="feud-header">' +
            '<div class="feud-side side-left">' +
              '<div class="feud-player-name">' + esc(p1) + '</div>' +
              '<div class="feud-player-clan">' + esc(clan1) + '</div>' +
            '</div>' +
            '<div class="feud-score">' +
              '<span class="feud-score-left' + (leftDom ? ' dominant' : '') + '">' + k1 + '</span>' +
              '<span class="feud-score-dash"> - </span>' +
              '<span class="feud-score-right' + (!leftDom ? ' dominant' : '') + '">' + k2 + '</span>' +
            '</div>' +
            '<div class="feud-side side-right">' +
              '<div class="feud-player-name">' + esc(p2) + '</div>' +
              '<div class="feud-player-clan">' + esc(clan2) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="feud-bar-wrap">' + tugBar(leftPct, leftDom) + '</div>' +
        '</div>';
    }

    sel1.addEventListener('change', renderFeudResult);
    sel2.addEventListener('change', renderFeudResult);
    renderFeudResult();

    // Hot rivalries: top 5 by total
    var hotWrap = document.getElementById('hot-rivalries');
    if (!hotWrap) return;
    hotWrap.innerHTML = '';

    var sorted = rivalries.slice().sort(function (a, b) { return b.total - a.total; }).slice(0, 5);
    sorted.forEach(function (r) {
      var total = r.p1_kills + r.p2_kills;
      var leftDom = r.p1_kills >= r.p2_kills;
      var c1 = r.p1_clan || 'Lone Wolf';
      var c2 = r.p2_clan || 'Lone Wolf';

      var card = document.createElement('div');
      card.className = 'hot-rivalry-card';
      card.innerHTML =
        '<div class="hot-rivalry-left">' +
          '<div class="hot-rivalry-player">' + esc(r.player1) + '</div>' +
          '<div class="hot-rivalry-clan">' + esc(c1) + '</div>' +
        '</div>' +
        '<div class="hot-rivalry-score">' +
          '<span class="score-left' + (leftDom ? ' dominant' : '') + '">' + r.p1_kills + '</span>' +
          '<span class="score-dash"> - </span>' +
          '<span class="score-right' + (!leftDom ? ' dominant' : '') + '">' + r.p2_kills + '</span>' +
        '</div>' +
        '<div class="hot-rivalry-right">' +
          '<div class="hot-rivalry-player">' + esc(r.player2) + '</div>' +
          '<div class="hot-rivalry-clan">' + esc(c2) + '</div>' +
        '</div>';
      hotWrap.appendChild(card);
    });
  }

  function esc(str) {
    var el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }

  function render(data, season) {
    var players = data.seasons[season] || [];
    buildChampions(players);
    buildClanWars(players);
    buildClanRivalries(data, season);
    buildBloodFeuds(data, season);
    buildTable(players);
    buildKillfeed(data.recent_kills || [], season);
  }

  function populateSeasons(data) {
    var sel = document.getElementById('season-select');
    sel.innerHTML = '';
    var names = Object.keys(data.seasons);
    // Latest season first (last in object)
    names.reverse().forEach(function (name, i) {
      var opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      if (i === 0) opt.selected = true;
      sel.appendChild(opt);
    });
    return names[0]; // latest
  }

  function init() {
    fetch('stats.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var current = populateSeasons(data);
        render(data, current);

        document.getElementById('season-select').addEventListener('change', function () {
          render(data, this.value);
        });

        if (data.updated_at) {
          var d = new Date(data.updated_at);
          document.getElementById('footer-update').textContent =
            'Last updated: ' + d.toLocaleString();
        }
      })
      .catch(function (err) {
        console.error('Failed to load stats.json:', err);
        document.getElementById('leaderboard-body').innerHTML =
          '<tr><td colspan="6" style="text-align:center;padding:40px;color:#7a7568;">Failed to load data</td></tr>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
