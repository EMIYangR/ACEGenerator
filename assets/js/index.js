(function () {
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var SINGLE_POINTS = [10, 7, 5, 3, 2, 1];
    var CYCLE_POINTS = [[10, 7, 5, 3, 2, 1], [20, 14, 10, 6, 4, 2], [20, 14, 10, 6, 4, 2], [30, 21, 15, 9, 6, 3]];
    var STATUS_CODES = [0, 1, 2];
    var TRUE_VALUES = ["1", "true", "yes", "y", "on", "t"];
    var QUALIFICATION_VALUES = ["byeup", "seedup", "up", "stayup", "stay", "staydown", "down"];
    var CONTROL_KEYS = [
        ["header", "ctrlHeader"],
        ["status", "ctrlStatus"],
        ["points", "ctrlPoints"],
        ["qualification", "ctrlQualification"],
        ["maps", "ctrlMaps"],
        ["vod", "ctrlVod"],
        ["opponents", "ctrlOpponents"]
    ];
    var STRUCTURAL_FIELDS = ["mapCount", "playerCount", "qualSegments"];
    var OPPONENT_FORMAT_SELECT = "opponentFormat";

    var matchList = document.getElementById("matchList");
    var outputEl = document.getElementById("output");
    var importTextEl = document.getElementById("importText");
    var importMessageEl = document.getElementById("importMessage");
    var outputMessageEl = document.getElementById("outputMessage");
    var toolbarStatusEl = document.getElementById("toolbarStatus");
    var controlNav = document.getElementById("controlNav");
    var quickNav = document.getElementById("quickNav");

    var state = {
        controls: { header: true, status: true, points: false, qualification: false, maps: true, vod: true, opponents: true },
        system: "4n",
        autoTime: true,
        interval: 40,
        opponentFormat: "oneLine",
        rawBefore: [],
        collapsedMatches: {},
        collapsedPlayers: {},
        matches: [createMatch()]
    };
    var outputText = "";

    function t(key, fallback) {
        return window.I18n.t(key, fallback);
    }

    function createMatch() {
        return {
            header: "",
            status: 0,
            points: [0, 0, 0, 0, 0, 0],
            qualSegments: "",
            qualStatuses: {},
            inlineKeys: [],
            rawInner: [],
            rawOuter: [],
            rawStream: false,
            timezone: "CST",
            mapCount: 4,
            playerCount: 6,
            maps: Array.from({ length: 4 }, function () { return { time: "", status: 0, vod: "" }; }),
            opponents: Array.from({ length: 6 }, function () {
                return { name: "", flag: "cn", results: Array.from({ length: 4 }, function () { return { rank: "", points: "" }; }) };
            })
        };
    }

    function clamp(value, min, max) {
        if (!Number.isFinite(value)) return min;
        return Math.max(min, Math.min(max, value));
    }

    function normalizeMapCount(value) {
        var count = clamp(Number(value), 1, 20);
        if (state.system === "4n") count = clamp(Math.round(count / 4) * 4, 4, 20);
        return count;
    }

    function normalizePlayerCount(value) {
        var count = clamp(Number(value), 1, 24);
        return clamp(Math.round(count / 6) * 6, 6, 24);
    }

    function esc(value) {
        return String(value === undefined || value === null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function isTruthy(value) {
        return TRUE_VALUES.includes(String(value === undefined || value === null ? "" : value).trim().toLowerCase());
    }

    function pointsForRank(rank, mapIndex) {
        var value = String(rank).trim();
        if (value === "") return "";
        var number = Number(value);
        if (!Number.isInteger(number) || number < 1 || number > 6) return "";
        var table = state.system === "single" ? SINGLE_POINTS : CYCLE_POINTS[mapIndex % 4];
        return table[number - 1];
    }

    function splitQualSegments(value) {
        return String(value || "").split(",").map(function (part) { return part.trim(); }).filter(Boolean);
    }

    function applyQualification(match, value) {
        var statuses = {};
        splitQualSegments(value).forEach(function (part) {
            var pair = part.split("=");
            var key = pair[0].trim();
            var code = (pair[1] || "").trim();
            if (key) statuses[key] = QUALIFICATION_VALUES.includes(code) ? code : "";
        });
        match.qualSegments = Object.keys(statuses).join(",");
        match.qualStatuses = statuses;
    }

    function qualificationValue(match) {
        return splitQualSegments(match.qualSegments).map(function (segment) {
            var code = match.qualStatuses[segment];
            return code ? segment + "=" + code : "";
        }).filter(Boolean).join(",");
    }

    function inlineTail(match, bgValue, inlineKeys) {
        return inlineKeys.map(function (key) {
            if (key === "bg") return "|bg=" + bgValue;
            if (key === "twitch") return "|twitch=";
            if (key === "youtube") return "|youtube=";
            if (/^p\d+$/.test(key)) {
                var value = String(match.points[Number(key.slice(1)) - 1] || "").trim();
                var numeric = Number(value);
                return "|" + key + "=" + (value === "" ? "" : (Number.isNaN(numeric) ? value : numeric));
            }
            return "";
        }).join("");
    }

    function inlineComplete(match, bgValue, inlineKeys) {
        return inlineKeys.length > 0 && inlineKeys.every(function (key) {
            if (key === "twitch" || key === "youtube") return true;
            if (key === "bg") return !!bgValue;
            if (/^p\d+$/.test(key)) return String(match.points[Number(key.slice(1)) - 1] || "").trim() !== "";
            return false;
        });
    }

    function resizeMaps(match) {
        var count = normalizeMapCount(match.mapCount);
        match.mapCount = count;
        while (match.maps.length < count) match.maps.push({ time: "", status: 0, vod: "" });
        match.maps.length = count;
        match.opponents.forEach(function (opponent) {
            while (opponent.results.length < count) opponent.results.push({ rank: "", points: "" });
            opponent.results.length = count;
        });
    }

    function resizePlayers(match) {
        var count = clamp(Number(match.playerCount), 1, 24);
        match.playerCount = count;
        while (match.opponents.length < count) {
            match.opponents.push({
                name: "",
                flag: "cn",
                results: Array.from({ length: match.mapCount }, function () { return { rank: "", points: "" }; })
            });
        }
        match.opponents.length = count;
    }

    function recalcPoints(match) {
        match.opponents.forEach(function (opponent) {
            opponent.results.forEach(function (result, mapIndex) {
                result.points = pointsForRank(result.rank, mapIndex);
            });
        });
    }

    function toLocalInput(dateText) {
        var parts = String(dateText).match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})\s*-\s*(\d{1,2}):(\d{2})$/);
        if (!parts) return "";
        var month = MONTHS.indexOf(parts[1]);
        if (month < 0) return "";
        return parts[3] + "-" + String(month + 1).padStart(2, "0") + "-" + String(Number(parts[2])).padStart(2, "0") + "T" + String(Number(parts[4])).padStart(2, "0") + ":" + parts[5];
    }

    function formatMapDate(match, map) {
        if (!map.time) return "";
        var parts = String(map.time).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
        if (!parts) return "";
        var month = MONTHS[Number(parts[2]) - 1];
        if (!month) return "";
        var abbr = String(match.timezone || "").trim();
        var suffix = abbr ? " {{Abbr/" + abbr + "}}" : "";
        return month + " " + Number(parts[3]) + ", " + parts[1] + " - " + parts[4] + ":" + parts[5] + suffix;
    }

    function addMinutes(timeString, minutes) {
        var parts = String(timeString).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
        if (!parts) return "";
        var date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]), Number(parts[4]), Number(parts[5]));
        date.setMinutes(date.getMinutes() + minutes);
        return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0") + "T" + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
    }

    function propagateTimes(match, fromIndex) {
        for (var i = fromIndex + 1; i < match.maps.length; i++) {
            var previous = match.maps[i - 1].time;
            if (!previous) break;
            match.maps[i].time = addMinutes(previous, state.interval);
        }
    }

    function syncMapTimeInputs(matchIndex, fromIndex) {
        var maps = state.matches[matchIndex].maps;
        for (var i = fromIndex + 1; i < maps.length; i++) {
            var input = matchList.querySelector('[data-field="mapTime"][data-match="' + matchIndex + '"][data-index="' + i + '"]');
            if (input) input.value = maps[i].time;
        }
    }

    function statusSelect(value, field, matchIndex, itemIndex) {
        var indexAttr = itemIndex === undefined ? "" : ' data-index="' + itemIndex + '"';
        var options = STATUS_CODES.map(function (code) {
            return '<option value="' + code + '" ' + (Number(value) === code ? "selected" : "") + ">" + t("status" + code) + "</option>";
        }).join("");
        return '<select data-field="' + field + '" data-match="' + matchIndex + '"' + indexAttr + ">" + options + "</select>";
    }

    function renderControlNav() {
        controlNav.innerHTML = CONTROL_KEYS.map(function (item) {
            var disabled = item[0] === "points";
            var active = state.controls[item[0]] ? " on" : "";
            return '<label class="control-chip' + active + (disabled ? " disabled" : "") + '"><input type="checkbox" data-control="' + item[0] + '" ' + (disabled ? "disabled " : "") + (state.controls[item[0]] ? "checked" : "") + "><span>" + t(item[1]) + "</span></label>";
        }).join("");
    }

    function renderMatch(match, matchIndex) {
        var sections = [];
        var matchCollapsed = !!state.collapsedMatches[matchIndex];
        var playersCollapsed = !!state.collapsedPlayers[matchIndex];
        var head = '<div class="match-head"><h3>' + t("match") + " M" + (matchIndex + 1) + "</h3>" +
            (state.controls.header ? '<input class="head-title" type="text" value="' + esc(match.header) + '" placeholder="' + t("headerLabel") + '" data-field="header" data-match="' + matchIndex + '">' : "") +
            (state.controls.status ? statusSelect(match.status, "status", matchIndex) : "") +
            '<span class="spacer"></span><button type="button" class="btn small btn-danger" data-action="removeMatch" data-match="' + matchIndex + '">' + t("removeMatch") + "</button>" +
            '<button type="button" class="icon-btn fold-btn" data-action="toggleMatch" data-match="' + matchIndex + '" aria-expanded="' + !matchCollapsed + '">' + (matchCollapsed ? "▸" : "▾") + "</button></div>";

        var actions = [];
        var mapStep = state.system === "4n" ? 4 : 1;
        if (state.controls.maps) {
            actions.push('<button type="button" class="btn small" data-action="addMap" data-match="' + matchIndex + '">' + t("addMap").replace("{n}", mapStep) + "</button>");
            actions.push('<button type="button" class="btn small" data-action="removeMap" data-match="' + matchIndex + '">' + t("removeMap").replace("{n}", mapStep) + "</button>");
        }
        if (state.controls.opponents) {
            actions.push('<button type="button" class="btn small" data-action="addPlayers" data-match="' + matchIndex + '">' + t("addPlayers").replace("{n}", 6) + "</button>");
            actions.push('<button type="button" class="btn small" data-action="removePlayers" data-match="' + matchIndex + '">' + t("removePlayers").replace("{n}", 6) + "</button>");
        }
        var cardActions = actions.length ? '<div class="card-actions">' + actions.join("") + "</div>" : "";

        if (state.controls.points) {
            var points = match.points.map(function (value, pointIndex) {
                var disabled = pointIndex > 0 && String(match.points[pointIndex - 1]).trim() === "0";
                return '<label class="point-cell"><span>p' + (pointIndex + 1) + '</span><input type="number" min="0" step="1" value="' + esc(value) + '" data-field="points" data-match="' + matchIndex + '" data-index="' + pointIndex + '" ' + (disabled ? "disabled" : "") + "></label>";
            }).join("");
            sections.push('<div class="section"><div class="points-grid">' + points + "</div></div>");
        }

        if (state.controls.qualification) {
            var qualSegments = splitQualSegments(match.qualSegments);
            var qualCells = qualSegments.map(function (segment, segmentIndex) {
                var selected = match.qualStatuses[segment] || "";
                var qualOptions = '<option value="" ' + (selected ? "" : "selected") + ">--</option>" + QUALIFICATION_VALUES.map(function (code) {
                    return '<option value="' + code + '" ' + (selected === code ? "selected" : "") + ">" + code + "</option>";
                }).join("");
                return '<label class="qual-cell"><span>' + esc(segment) + '</span><select data-field="qualStatus" data-match="' + matchIndex + '" data-index="' + segmentIndex + '" data-segment="' + esc(segment) + '">' + qualOptions + "</select></label>";
            }).join("");
            sections.push('<div class="section"><div class="section-title"><span>' + t("qualTitle") + '</span><label><span>' + t("qualSegments") + '</span><input class="qual-input" type="text" value="' + esc(match.qualSegments) + '" placeholder="1,2-3,4-6" data-field="qualSegments" data-match="' + matchIndex + '"></label></div>' +
                (qualCells ? '<div class="qual-grid">' + qualCells + "</div>" : '<div class="qual-empty">' + t("qualHint") + "</div>") + "</div>");
        }

        if (state.controls.maps) {
            var vodClass = state.controls.vod ? "" : " vod-off";
            var rows = match.maps.map(function (map, mapIndex) {
                return '<div class="map-row' + vodClass + '"><span class="row-label">m' + (mapIndex + 1) + '</span>' +
                    '<input type="datetime-local" value="' + esc(map.time) + '" data-field="mapTime" data-match="' + matchIndex + '" data-index="' + mapIndex + '">' +
                    statusSelect(map.status, "mapStatus", matchIndex, mapIndex) +
                    (state.controls.vod ? '<input class="vod" type="text" value="' + esc(map.vod) + '" placeholder="' + t("vod") + '" data-field="mapVod" data-match="' + matchIndex + '" data-index="' + mapIndex + '">' : "") +
                    '<button type="button" class="icon-btn" data-action="removeMap" data-match="' + matchIndex + '" data-index="' + mapIndex + '">×</button></div>';
            }).join("");
            sections.push('<div class="section"><div class="section-title"><span>' + t("mapsTitle") + '</span><label><span>' + t("timezone") + '</span><input class="tz-input" type="text" value="' + esc(match.timezone) + '" placeholder="CST" data-field="timezone" data-match="' + matchIndex + '"></label><label><span>' + t("mapCount") + '</span><input type="number" min="1" max="20" step="1" value="' + esc(match.mapCount) + '" data-field="mapCount" data-match="' + matchIndex + '"></label><label><input type="checkbox" data-field="autoTime" ' + (state.autoTime ? "checked" : "") + '><span>' + t("autoTime") + '</span></label><label><span>' + t("interval") + '</span><input class="interval-input" type="number" min="1" max="240" step="1" value="' + esc(state.interval) + '" data-field="interval"></label></div>' + rows + "</div>");
        }

        if (state.controls.opponents) {
            var headers = match.maps.map(function (_, mapIndex) { return "<span>m" + (mapIndex + 1) + "</span>"; }).join("");
            var rowsOpponent = match.opponents.map(function (opponent, opponentIndex) {
                var cells = opponent.results.map(function (result, mapIndex) {
                    return '<div class="result-cell"><input type="number" min="1" max="6" step="1" value="' + esc(result.rank) + '" placeholder="' + t("rank") + '" data-field="rank" data-match="' + matchIndex + '" data-op="' + opponentIndex + '" data-index="' + mapIndex + '"></div>';
                }).join("");
                return '<div class="rank-row"><span class="player-index">' + (opponentIndex + 1) + "</span>" + '<div class="opponent-meta">' +
                    '<input type="text" value="' + esc(opponent.name) + '" placeholder="' + t("player") + '" data-field="opName" data-match="' + matchIndex + '" data-index="' + opponentIndex + '">' +
                    '<input type="text" value="' + esc(opponent.flag) + '" placeholder="' + t("region") + '" data-field="opFlag" data-match="' + matchIndex + '" data-index="' + opponentIndex + '">' +
                    '<button type="button" class="icon-btn" data-action="removePlayer" data-match="' + matchIndex + '" data-index="' + opponentIndex + '">×</button></div>' +
                    '<div class="result-cells">' + cells + "</div></div>";
            }).join("");
            sections.push('<div class="section players-section' + (playersCollapsed ? " players-collapsed" : "") + '"><div class="section-title"><span>' + t("opponentsTitle") + '</span><label><span>' + t("playerCount") + '</span><input type="number" min="1" max="24" step="1" value="' + esc(match.playerCount) + '" data-field="playerCount" data-match="' + matchIndex + '"></label><button type="button" class="fold-inline" data-action="togglePlayers" data-match="' + matchIndex + '" aria-expanded="' + !playersCollapsed + '">' + (playersCollapsed ? "▸" : "▾") + '</button></div>' +
                '<div class="players-body"><div class="rank-table" style="--maps:' + match.mapCount + '"><div class="rank-row rank-head-row"><span class="player-index">#</span><span>' + t("player") + " / " + t("region") + '</span><div class="result-cells">' + headers + "</div></div>" + rowsOpponent + "</div></div></div>");
        }

        return '<article class="match-card' + (matchCollapsed ? " collapsed" : "") + '" id="match-' + matchIndex + '">' + head + '<div class="match-body">' + cardActions + sections.join("") + "</div></article>";
    }

    function renderQuickNav() {
        var buttons = state.matches.map(function (_, index) {
            return '<button type="button" class="btn small" data-goto="' + index + '">M' + (index + 1) + "</button>";
        }).join("");
        quickNav.innerHTML = '<span class="quick-label">' + t("jumpTo") + '</span>' + buttons +
            '<button type="button" class="btn small" data-nav-action="expandAll">' + t("expandAll") + "</button>" +
            '<button type="button" class="btn small" data-nav-action="collapseAll">' + t("collapseAll") + "</button>";
    }

    function renderMatches() {
        matchList.innerHTML = state.matches.map(renderMatch).join("");
        renderQuickNav();
        state.matches.forEach(function (_, index) { updatePointStates(index); });
    }

    function updatePointStates(matchIndex) {
        var match = state.matches[matchIndex];
        var cells = matchList.querySelectorAll('[data-field="points"][data-match="' + matchIndex + '"]');
        var stopped = false;
        cells.forEach(function (input, index) {
            input.disabled = stopped;
            if (stopped) {
                input.value = "0";
                match.points[index] = "0";
            }
            var value = String(input.value).trim();
            if (!stopped && (value === "" || Number(value) === 0)) stopped = true;
        });
    }

    function handleField(element) {
        var field = element.dataset.field;
        if (field === "autoTime") {
            state.autoTime = element.checked;
            if (state.autoTime) {
                state.matches.forEach(function (match, matchIndex) {
                    var last = -1;
                    match.maps.forEach(function (map, mapIndex) {
                        if (map.time) last = mapIndex;
                    });
                    if (last >= 0) {
                        propagateTimes(match, last);
                        syncMapTimeInputs(matchIndex, last);
                    }
                });
            }
            refreshOutput();
            return;
        }
        if (field === "interval") {
            state.interval = clamp(Number(element.value), 1, 240);
            if (state.autoTime) {
                state.matches.forEach(function (match, matchIndex) {
                    var first = match.maps.findIndex(function (map) { return !!map.time; });
                    if (first >= 0) {
                        propagateTimes(match, first);
                        syncMapTimeInputs(matchIndex, first);
                    }
                });
            }
            refreshOutput();
            return;
        }
        var matchIndex = Number(element.dataset.match);
        var match = state.matches[matchIndex];
        if (!match) return;
        var itemIndex = Number(element.dataset.index);
        var opponentIndex = Number(element.dataset.op);

        if (field === "mapCount") {
            match.mapCount = normalizeMapCount(element.value);
            resizeMaps(match);
            recalcPoints(match);
            renderMatches();
            return;
        }
        if (field === "playerCount") {
            match.playerCount = clamp(Number(element.value), 1, 24);
            resizePlayers(match);
            renderMatches();
            return;
        }
        if (field === "header") {
            match.header = element.value;
            return;
        }
        if (field === "status") {
            var next = Number(element.value);
            var previous = match.status;
            if (previous === 2 && next !== 2 && !window.confirm(t("msgStatusRisk"))) {
                element.value = String(previous);
                return;
            }
            match.status = next;
            match.maps.forEach(function (map) { map.status = next; });
            matchList.querySelectorAll('[data-field="mapStatus"][data-match="' + matchIndex + '"]').forEach(function (select) {
                select.value = String(next);
            });
            return;
        }
        if (field === "points") {
            match.points[itemIndex] = element.value;
            updatePointStates(matchIndex);
            return;
        }
        if (field === "qualSegments") {
            match.qualSegments = element.value;
            renderMatches();
            return;
        }
        if (field === "qualStatus") {
            match.qualStatuses[element.dataset.segment] = element.value;
            return;
        }
        if (field === "timezone") {
            match.timezone = element.value;
            return;
        }
        if (field === "mapTime") {
            match.maps[itemIndex].time = element.value;
            if (state.autoTime) {
                propagateTimes(match, itemIndex);
                syncMapTimeInputs(matchIndex, itemIndex);
            }
            return;
        }
        if (field === "mapStatus") {
            match.maps[itemIndex].status = Number(element.value);
            return;
        }
        if (field === "mapVod") {
            match.maps[itemIndex].vod = element.value;
            return;
        }
        if (field === "opName") {
            match.opponents[itemIndex].name = element.value;
            return;
        }
        if (field === "opFlag") {
            match.opponents[itemIndex].flag = element.value;
            return;
        }
        if (field === "rank") {
            var result = match.opponents[opponentIndex].results[itemIndex];
            result.rank = element.value;
            result.points = pointsForRank(element.value, itemIndex);
        }
    }

    function generateOutput() {
        var lines = [];
        (state.rawBefore || []).forEach(function (raw) { lines.push(raw); });
        state.matches.forEach(function (match, matchIndex) {
            var number = matchIndex + 1;
            var bgValue = qualificationValue(match);
            var inlineKeys = match.inlineKeys || [];
            var inline = state.controls.status && inlineComplete(match, bgValue, inlineKeys);
            if (state.controls.header) lines.push("|M" + number + "header=" + match.header);
            if (state.controls.status) {
                lines.push("|M" + number + "={{Match|finished=" + (match.status === 2 ? "true" : "") + (inline ? inlineTail(match, bgValue, inlineKeys) : ""));
            }
            if (state.controls.qualification && bgValue && !(inline && inlineKeys.indexOf("bg") >= 0)) {
                lines.push("    |bg=" + bgValue);
            }
            if (state.controls.status) {
                var stopped = false;
                match.points.forEach(function (value, pointIndex) {
                    if (stopped) return;
                    var clean = String(value).trim();
                    var numeric = Number(clean);
                    var key = "p" + (pointIndex + 1);
                    if (!inline || inlineKeys.indexOf(key) < 0) {
                        lines.push("    |" + key + "=" + (Number.isNaN(numeric) ? clean : numeric));
                    }
                    if (clean === "" || numeric === 0 || Number.isNaN(numeric)) stopped = true;
                });
                if ((!inline || inlineKeys.indexOf("twitch") < 0) && !match.rawStream) lines.push("    |twitch=|youtube=");
            }
            if (state.controls.maps) {
                match.maps.forEach(function (map, mapIndex) {
                    var date = formatMapDate(match, map);
                    var vodPart = state.controls.vod ? "|vod=" + map.vod : "";
                    lines.push("    |map" + (mapIndex + 1) + "={{Map|date=" + (date ? date + " " : "") + "|finished=" + (map.status === 2 ? "true" : "") + vodPart + "}}");
                });
            }
            if (state.controls.opponents) {
                var fragments = match.opponents.map(function (opponent) {
                    return opponent.results.map(function (result, mapIndex) {
                        return "|m" + (mapIndex + 1) + "={{MS|" + result.rank + "|p=" + result.points + "}}";
                    });
                });
                var widths = [];
                fragments.forEach(function (row) {
                    row.forEach(function (cell, columnIndex) {
                        widths[columnIndex] = Math.max(widths[columnIndex] || 0, cell.length);
                    });
                });
                fragments = fragments.map(function (row) {
                    return row.map(function (cell, columnIndex) {
                        var lastInLine = state.opponentFormat === "perRound"
                            ? (columnIndex % 4 === 3 || columnIndex === row.length - 1)
                            : (columnIndex === row.length - 1);
                        if (lastInLine) return cell;
                        return cell + " ".repeat(widths[columnIndex] - cell.length);
                    });
                });
                match.opponents.forEach(function (opponent, opponentIndex) {
                    lines.push("    |opponent" + (opponentIndex + 1) + "={{SoloOpponent|" + opponent.name + "|flag=" + opponent.flag);
                    var row = fragments[opponentIndex];
                    if (state.opponentFormat === "perRound") {
                        for (var i = 0; i < row.length; i += 4) {
                            lines.push("        " + row.slice(i, i + 4).join(""));
                        }
                    } else {
                        lines.push("        " + row.join(""));
                    }
                    lines.push("    }}");
                });
            }
            (match.rawInner || []).forEach(function (raw) { lines.push(raw); });
            if (state.controls.status) lines.push("}}");
            if (match.rawOuter && match.rawOuter.length) {
                match.rawOuter.forEach(function (raw) { lines.push(raw); });
            } else if (matchIndex < state.matches.length - 1) {
                lines.push("");
            }
        });
        return lines.join("\n");
    }

    function refreshOutput() {
        outputText = generateOutput();
        outputEl.textContent = outputText;
    }

    function isKnownLine(line) {
        return /^\|M\d+header=/.test(line)
            || /^\|M\d+=\{\{Match\|finished=/.test(line)
            || /^\|p\d+=/.test(line)
            || /^\|bg=/.test(line)
            || /^\|twitch=\|youtube=$/.test(line)
            || /^\|twitch=$/.test(line)
            || /^\|youtube=$/.test(line)
            || /^\|map\d+=\{\{Map\|/.test(line)
            || /^\|opponent\d+=\{\{SoloOpponent\|/.test(line)
            || /^\|m\d+=\{\{MS\|/.test(line);
    }

    function parseTemplate(text) {
        var parsed = [];
        var rawBefore = [];
        var current = null;
        var opponent = null;
        var seenFirst = false;
        var inMatch = false;
        var depth = 0;

        function ensureMatch(index) {
            while (parsed.length <= index) parsed.push(createMatch());
            return parsed[index];
        }

        text.split(/\r?\n/).forEach(function (raw) {
            var line = raw.trim();
            var comment = line.startsWith("//");
            var opens = comment ? 0 : (line.match(/\{\{/g) || []).length;
            var closes = comment ? 0 : (line.match(/\}\}/g) || []).length;

            var header = line.match(/^\|M(\d+)header=(.*)$/);
            if (header) {
                current = ensureMatch(Number(header[1]) - 1);
                current.header = header[2].trim();
                opponent = null;
                seenFirst = true;
                return;
            }

            var start = line.match(/^\|M(\d+)=\{\{Match\|finished=(.*)$/);
            if (start) {
                current = ensureMatch(Number(start[1]) - 1);
                current.status = isTruthy(start[2].split("|")[0]) ? 2 : 0;
                opponent = null;
                current.inlineKeys = parseInlineTail(start[2], current);
                inMatch = true;
                depth = Math.max(opens - closes, 1);
                seenFirst = true;
                return;
            }

            var inMatchBefore = inMatch;
            if (inMatch) depth += opens - closes;
            var known = line === "}}" ? inMatchBefore : isKnownLine(line);
            if (!known && current && /^\|(twitch|youtube)=/.test(line)) current.rawStream = true;

            if (known) {
                seenFirst = true;
            } else if (!seenFirst || !current) {
                rawBefore.push(raw);
            } else if (inMatchBefore) {
                current.rawInner.push(raw);
            } else {
                current.rawOuter.push(raw);
            }

            if (inMatch && depth <= 0) inMatch = false;

            if (comment || !line || !current || !known) return;

            var point = line.match(/^\|p(\d+)=(.*)$/);
            if (point) {
                var pointIndex = Number(point[1]) - 1;
                if (pointIndex >= 0 && pointIndex < 6) current.points[pointIndex] = point[2].trim();
                return;
            }

            var bgLine = line.match(/^\|bg=(.*)$/);
            if (bgLine) {
                applyQualification(current, bgLine[1].trim());
                return;
            }

            var map = line.match(/^\|map(\d+)=\{\{Map\|date=(.*?)\s*\|finished=(.*?)(?:\s*\|vod=(.*?))?\}\}$/);
            if (map) {
                var mapIndex = Number(map[1]) - 1;
                while (current.maps.length <= mapIndex) current.maps.push({ time: "", status: 0, vod: "" });
                var dateText = map[2].trim();
                var abbrMatch = dateText.match(/\{\{Abbr\/([^}]+)\}\}/);
                if (abbrMatch) current.timezone = abbrMatch[1];
                var plain = dateText.replace(/\s*\{\{Abbr\/[^}]+\}\}/g, "").trim();
                current.maps[mapIndex] = { time: toLocalInput(plain), status: isTruthy(map[3]) ? 2 : 0, vod: (map[4] || "").trim() };
                return;
            }

            var opponentStart = line.match(/^\|opponent(\d+)=\{\{SoloOpponent\|(.*?)\|flag=(.*)$/);
            if (opponentStart) {
                var opponentIndex = Number(opponentStart[1]) - 1;
                while (current.opponents.length <= opponentIndex) current.opponents.push({ name: "", flag: "cn", results: [] });
                opponent = current.opponents[opponentIndex];
                opponent.name = opponentStart[2].trim();
                opponent.flag = opponentStart[3].replace(/\}\}\s*$/, "").trim() || "cn";
                return;
            }

            var resultPattern = /\|m(\d+)=\{\{MS\|([^|]*)\|p=([^}]*)\}\}/g;
            var found = false;
            var result;
            while ((result = resultPattern.exec(line)) !== null) {
                found = true;
                if (!opponent) continue;
                var resultIndex = Number(result[1]) - 1;
                while (opponent.results.length <= resultIndex) opponent.results.push({ rank: "", points: "" });
                opponent.results[resultIndex] = { rank: result[2].trim(), points: result[3].trim() };
            }
            if (found) return;
        });

        parsed.forEach(function (match) {
            match.mapCount = match.maps.length || 4;
            while (match.maps.length < match.mapCount) match.maps.push({ time: "", status: 0, vod: "" });
            match.playerCount = match.opponents.length || 6;
            match.opponents.forEach(function (entry) {
                while (entry.results.length < match.mapCount) entry.results.push({ rank: "", points: "" });
            });
            recalcPoints(match);
        });

        return { matches: parsed, rawBefore: rawBefore };
    }

    function parseInlineTail(tail, match) {
        var keys = [];
        var keyPattern = /\|(p\d+|bg|twitch|youtube)=/g;
        var found;
        while ((found = keyPattern.exec(tail)) !== null) keys.push(found[1]);
        if (!keys.length) return keys;
        var bg = tail.match(/\|bg=([^|]*)/);
        if (bg) applyQualification(match, bg[1].trim());
        var pointPattern = /\|p(\d+)=([^|]*)/g;
        var point;
        while ((point = pointPattern.exec(tail)) !== null) {
            var index = Number(point[1]) - 1;
            if (index >= 0 && index < 6) match.points[index] = point[2].trim();
        }
        return keys;
    }

    function setMessage(element, text, kind) {
        element.textContent = text;
        element.className = "status " + (kind || "");
    }

    function clearSiteCookies() {
        document.cookie.split(";").forEach(function (item) {
            var equal = item.indexOf("=");
            var name = (equal > -1 ? item.substring(0, equal) : item).trim();
            if (name) document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });
    }

    function initialize() {
        renderControlNav();
        renderMatches();
        refreshOutput();

        document.addEventListener("i18n:applied", function () {
            renderControlNav();
            renderMatches();
            refreshOutput();
        });

        document.getElementById("langToggle").addEventListener("click", function () {
            window.I18n.load(window.I18n.language() === "zh" ? "en" : "zh");
        });

        quickNav.addEventListener("click", function (event) {
            var goto = event.target.dataset.goto;
            if (goto !== undefined) {
                var index = Number(goto);
                state.collapsedMatches[index] = false;
                renderMatches();
                var card = document.getElementById("match-" + index);
                if (card && card.scrollIntoView) card.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
            }
            var navAction = event.target.dataset.navAction;
            if (!navAction) return;
            if (navAction === "expandAll") {
                state.collapsedMatches = {};
                state.collapsedPlayers = {};
            }
            if (navAction === "collapseAll") {
                state.matches.forEach(function (_, index) {
                    state.collapsedMatches[index] = true;
                    state.collapsedPlayers[index] = true;
                });
            }
            renderMatches();
        });

        document.getElementById("clearCookiesBtn").addEventListener("click", function () {
            clearSiteCookies();
            window.localStorage.removeItem("aceLang");
            window.I18n.reset();
            setMessage(toolbarStatusEl, t("msgCleared"), "ok");
        });

        document.getElementById("clearStorageBtn").addEventListener("click", function () {
            window.localStorage.clear();
            window.I18n.reset();
            setMessage(toolbarStatusEl, t("msgCleared"), "ok");
        });

        controlNav.addEventListener("change", function (event) {
            var key = event.target.dataset.control;
            if (!key || event.target.disabled) return;
            state.controls[key] = event.target.checked;
            event.target.parentElement.classList.toggle("on", event.target.checked);
            renderMatches();
            refreshOutput();
        });

        document.getElementById("pointRule").addEventListener("change", function (event) {
            if (event.target.name !== "globalSystem") return;
            state.system = event.target.value;
            state.matches.forEach(function (match) {
                match.mapCount = normalizeMapCount(match.mapCount);
                resizeMaps(match);
                recalcPoints(match);
            });
            renderMatches();
            refreshOutput();
        });

        matchList.addEventListener("input", function (event) {
            if (STRUCTURAL_FIELDS.includes(event.target.dataset.field)) return;
            handleField(event.target);
            refreshOutput();
        });

        matchList.addEventListener("change", function (event) {
            handleField(event.target);
            refreshOutput();
        });

        matchList.addEventListener("click", function (event) {
            var button = event.target.closest("button[data-action]");
            if (!button) return;
            var action = button.dataset.action;
            var matchIndex = Number(button.dataset.match);
            var match = state.matches[matchIndex];
            if (!match) return;

            if (action === "toggleMatch") {
                var collapsed = !state.collapsedMatches[matchIndex];
                state.collapsedMatches[matchIndex] = collapsed;
                var card = button.closest(".match-card");
                card.classList.toggle("collapsed", collapsed);
                button.textContent = collapsed ? "▸" : "▾";
                button.setAttribute("aria-expanded", String(!collapsed));
                return;
            }
            if (action === "togglePlayers") {
                var playersCollapsed = !state.collapsedPlayers[matchIndex];
                state.collapsedPlayers[matchIndex] = playersCollapsed;
                var playerSection = button.closest(".players-section");
                playerSection.classList.toggle("players-collapsed", playersCollapsed);
                button.textContent = playersCollapsed ? "▸" : "▾";
                button.setAttribute("aria-expanded", String(!playersCollapsed));
                return;
            }

            var step = state.system === "4n" ? 4 : 1;

            if (action === "addMap") {
                match.mapCount = normalizeMapCount(match.mapCount + step);
                resizeMaps(match);
                recalcPoints(match);
            }
            if (action === "removeMap") {
                match.mapCount = normalizeMapCount(match.mapCount - step);
                resizeMaps(match);
                recalcPoints(match);
            }
            if (action === "addPlayers") {
                match.playerCount = normalizePlayerCount(match.playerCount + 6);
                resizePlayers(match);
            }
            if (action === "removePlayers") {
                match.playerCount = normalizePlayerCount(match.playerCount - 6);
                resizePlayers(match);
            }
            if (action === "removeMatch") {
                state.matches.splice(matchIndex, 1);
                if (!state.matches.length) state.matches.push(createMatch());
            }
            renderMatches();
            refreshOutput();
        });

        document.getElementById("addMatchBtn").addEventListener("click", function () {
            state.matches.push(createMatch());
            renderMatches();
            refreshOutput();
        });

        document.getElementById("clearImportBtn").addEventListener("click", function () {
            importTextEl.value = "";
            setMessage(importMessageEl, "", "");
        });

        document.getElementById("importBtn").addEventListener("click", function () {
            var result = parseTemplate(importTextEl.value);
            if (!result.matches.length) {
                setMessage(importMessageEl, t("msgNoTemplate"), "err");
                return;
            }
            state.matches = result.matches;
            state.rawBefore = result.rawBefore;
            renderMatches();
            refreshOutput();
            setMessage(importMessageEl, t("msgImported").replace("{n}", result.matches.length), "ok");
        });

        var formatSelect = document.getElementById(OPPONENT_FORMAT_SELECT);
        if (formatSelect) {
            formatSelect.value = state.opponentFormat;
            formatSelect.addEventListener("change", function (event) {
                state.opponentFormat = event.target.value;
                refreshOutput();
            });
        }

        var generateBtn = document.getElementById("generateBtn");
        if (generateBtn) {
            generateBtn.addEventListener("click", function () {
                refreshOutput();
                if (outputEl.scrollIntoView) outputEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
            });
        }

        var backToTop = document.getElementById("backToTop");
        if (backToTop) {
            backToTop.addEventListener("click", function () {
                if (window.scrollTo) window.scrollTo({ top: 0, behavior: "smooth" });
            });
        }

        var notesSidebar = document.getElementById("notesSidebar");
        var notesToggle = document.getElementById("notesToggle");
        if (notesSidebar && notesToggle) {
            if (window.innerWidth <= 860) notesSidebar.classList.add("is-collapsed");
            notesToggle.setAttribute("aria-expanded", String(!notesSidebar.classList.contains("is-collapsed")));
            notesToggle.addEventListener("click", function () {
                var collapsed = notesSidebar.classList.toggle("is-collapsed");
                notesToggle.setAttribute("aria-expanded", String(!collapsed));
            });
        }

        document.getElementById("content").addEventListener("click", function (event) {
            var fold = event.target.closest("[data-panel-fold]");
            if (!fold) return;
            var body = document.querySelector('[data-panel-body="' + fold.dataset.panelFold + '"]');
            if (!body) return;
            var collapsed = body.classList.toggle("is-collapsed");
            fold.textContent = collapsed ? "▸" : "▾";
            fold.setAttribute("aria-expanded", String(!collapsed));
        });

        document.getElementById("copyBtn").addEventListener("click", async function () {
            try {
                await navigator.clipboard.writeText(outputText);
                setMessage(outputMessageEl, t("msgCopied"), "ok");
            } catch (error) {
                var area = document.createElement("textarea");
                area.value = outputText;
                area.style.position = "fixed";
                area.style.opacity = "0";
                document.body.appendChild(area);
                area.select();
                document.execCommand("copy");
                area.remove();
                setMessage(outputMessageEl, t("msgCopied"), "ok");
            }
        });

        document.getElementById("downloadBtn").addEventListener("click", function () {
            var blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
            var url = URL.createObjectURL(blob);
            var link = document.createElement("a");
            link.href = url;
            link.download = "ACE-template.txt";
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        });
    }

    function start() {
        window.I18n.ready.then(initialize);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
