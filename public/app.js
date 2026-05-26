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

    var rank = 0;
    sorted.forEach(function (c) {
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
        '<span class="kill-cause">(' + esc(k.cause) + ')</span>' +
        '<span class="kill-time">' + formatTimestamp(k.timestamp) + '</span>';
      wrap.appendChild(entry);
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
