/* EduDeck name filter, shared by the landing page and the online list.
   Exposes window.EduNameFilter = { isBanned, isReserved, normName, checkCode }.
   A name is folded several ways (look-alike letters, leet, stretched letters,
   sound-alikes, reversed) and blocked if any version contains a banned word. */
(function () {
  // The word lists are stored encoded so they don't show up as readable text
  // in the page source. Decode them with tools/wordlist.js to edit.
  var W = (function (b64) {
    var s = atob(b64), k = "edudeck", out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) ^ k.charCodeAt(i % k.length);
    return JSON.parse(new TextDecoder().decode(out));
  })(
    "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"
  );
  var BANNED = W.banned, ACRO = W.acro, WHOLE = W.whole, SAFE = W.safe, SEVERE = W.severe, NO_SWAP = W.noSwap,
    DEEP = W.deep, DEEP_SAFE = W.deepSafe, SOUND_ROOTS = W.soundRoots, FUZZY = W.fuzzy, REVERSED = W.reversed;

  // Letters from other alphabets that look like latin ones (Cyrillic, Greek,
  // IPA). Accents and fancy/fullwidth fonts are handled by NFKD below.
  var LOOKALIKE = {
    "\u0430": "a", "\u0435": "e", "\u0451": "e", "\u043e": "o", "\u0440": "p",
    "\u0441": "c", "\u0443": "y", "\u0445": "x", "\u0456": "i", "\u0457": "i",
    "\u0458": "j", "\u043a": "k", "\u043c": "m", "\u043d": "h", "\u0442": "t",
    "\u0432": "b", "\u0433": "r", "\u0438": "u", "\u043f": "n", "\u0434": "d",
    "\u0501": "d", "\u0261": "g", "\u0131": "i", "\u2113": "l", "\u0455": "s",
    "\u04bb": "h", "\u0475": "v", "\u051b": "q", "\u051d": "w", "\u0493": "f",
    "\u03b1": "a", "\u03b2": "b", "\u03b5": "e", "\u03b7": "n", "\u03b9": "i",
    "\u03ba": "k", "\u03bd": "v", "\u03bf": "o", "\u03c1": "p", "\u03c4": "t",
    "\u03c5": "u", "\u03c7": "x", "\u03b3": "y", "\u03c9": "w", "\u0274": "n",
    "\u0262": "g", "\u026a": "i", "\u0280": "r", "\u1d07": "e", "\u1d00": "a",
    "\u0493": "f", "\u00df": "ss", "\u00f8": "o", "\u0111": "d", "\u0142": "l",
    "\u0192": "f", "\u0268": "i", "\u0251": "a", "\u0259": "e", "\u0254": "o"
  };

  function fold(s) {
    s = String(s);
    try { s = s.normalize("NFKD"); } catch (e) {}
    s = s.replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var out = "";
    for (var i = 0; i < s.length; i++) out += LOOKALIKE[s[i]] || s[i];
    return out;
  }

  // Fold symbol/letter lookalikes and leet ("h3ll0", "ph", "|<") so names
  // reduce to plain letters before matching.
  function normName(s) {
    return fold(s)
      .replace(/\|\\\/\||\/\\\/\\/g, "m").replace(/\|\\\||\/\\\//g, "n")
      .replace(/\\\/\\\/|vv/g, "w").replace(/\\\//g, "v").replace(/\|_\|/g, "u")
      .replace(/\|</g, "k").replace(/\|\)/g, "d").replace(/\(\)|\[\]/g, "o")
      .replace(/ph/g, "f")
      .replace(/[0]/g, "o").replace(/[1!|]/g, "i").replace(/[3\u20ac]/g, "e")
      .replace(/[4@]/g, "a").replace(/[5$\u00a7]/g, "s").replace(/[7+]/g, "t")
      .replace(/[8]/g, "b").replace(/[6]/g, "g").replace(/[9]/g, "g")
      .replace(/[()<>{}\[\]]/g, "c").replace(/[^a-z]/g, "");
  }
  // Drop runs of a repeated letter to one, so "heeelllooo" -> "helo".
  function collapse(s) { return s.replace(/(.)\1+/g, "$1"); }
  // Sound-alike spelling: ck->k, q/j->g, y->i, doubled letters.
  function soundAlike(s) {
    return s.replace(/ck/g, "k").replace(/[qj]/g, "g").replace(/y/g, "i")
      .replace(/ni(kk|cc|bb)/g, W.sound).replace(/ee/g, "i");
  }
  function reverse(s) { return s.split("").reverse().join(""); }

  // Collapsed forms of long enough words, to catch stretched spellings without
  // turning short words (4+ letters only) into false positives.
  var BANNED_COLLAPSED = [];
  for (var _i = 0; _i < BANNED.length; _i++) {
    var _c = collapse(BANNED[_i]);
    if (_c.length >= 4) BANNED_COLLAPSED.push(_c);
  }

  // ---- misspelling checks (s = a window of the name, w = the slur) --------
  function oneInserted(s, w) {           // w with one extra letter
    for (var k = 0; k < s.length; k++) {
      if (s.slice(0, k) + s.slice(k + 1) === w) return true;
    }
    return false;
  }
  function oneSwapped(s, w) {            // one letter changed, not the first
    if (s[0] !== w[0]) return false;
    var diff = 0;
    for (var k = 1; k < w.length; k++) if (s[k] !== w[k] && ++diff > 1) return false;
    return true;
  }
  function oneDropped(s, w) {            // one letter missing, not the first
    for (var k = 1; k < w.length; k++) {
      if (w.slice(0, k) + w.slice(k + 1) === s) return true;
    }
    return false;
  }
  function transposed(s, w) {            // two neighbouring letters flipped
    for (var k = 1; k + 1 < w.length; k++) {
      if (w.slice(0, k) + w[k + 1] + w[k] + w.slice(k + 2) === s) return true;
    }
    return false;
  }
  function spreadOut(s, w) {             // w's letters in order, starting at s[0]
    var k = 0;
    for (var m = 0; m < s.length && k < w.length; m++) if (s[m] === w[k]) k++;
    return k === w.length && s[0] === w[0];
  }

  // Any single edit, including the first letter.
  function oneEdit(t, w) {
    var k, L = w.length;
    if (t.length === L) {
      var diff = 0;
      for (k = 0; k < L; k++) if (t[k] !== w[k]) diff++;
      if (diff <= 1) return true;
      for (k = 0; k + 1 < L; k++) {
        if (w.slice(0, k) + w[k + 1] + w[k] + w.slice(k + 2) === t) return true;
      }
      return false;
    }
    if (t.length === L + 1) return oneInserted(t, w);
    if (t.length === L - 1) {
      for (k = 0; k < L; k++) if (w.slice(0, k) + w.slice(k + 1) === t) return true;
    }
    return false;
  }
  function deepHit(s) {
    for (var i = 0; i < DEEP.length; i++) {
      var w = DEEP[i], L = w.length;
      for (var j = 0; j < s.length; j++) {
        for (var len = L - 1; len <= L + 1; len++) {
          if (j + len <= s.length && oneEdit(s.substr(j, len), w)) return true;
        }
        if (L >= 6 && spreadOut(s.substr(j, L + 2), w)) return true;
      }
    }
    return false;
  }

  function contains(s, list) {
    for (var i = 0; i < list.length; i++) if (s.indexOf(list[i]) !== -1) return true;
    return false;
  }
  function fuzzyHit(s) {
    var i, j, w, L;
    for (i = 0; i < SAFE.length; i++) s = s.split(SAFE[i]).join("-");
    for (i = 0; i < FUZZY.length; i++) {
      w = FUZZY[i];
      for (j = 0; j + w.length + 1 <= s.length; j++) {
        if (oneInserted(s.substr(j, w.length + 1), w)) return true;
      }
    }
    for (i = 0; i < SEVERE.length; i++) {
      w = SEVERE[i]; L = w.length;
      for (j = 0; j < s.length; j++) {
        if (NO_SWAP.indexOf(w) === -1 && oneSwapped(s.substr(j, L), w)) return true;
        if (transposed(s.substr(j, L), w)) return true;
        if (L >= 6 && oneDropped(s.substr(j, L - 1), w)) return true;
        // up to two extra letters mixed in (one for short words)
        if (spreadOut(s.substr(j, L + (L >= 6 ? 2 : 1)), w)) return true;
      }
    }
    return false;
  }

  // Block anything that even resembles an address (aggressive, for privacy).
  var STREET = /(street|avenue|\bave\b|\brd\b|road|\bln\b|lane|\bdr\b|drive|boulevard|\bblvd\b|\bct\b|court|circle|\bcir\b|\bway\b|place|\bpl\b|highway|\bhwy\b|terrace|\bter\b|\bapt\b|suite|\bste\b|\bunit\b|\bbox\b|\bpo\b|\bcrescent\b|\bcres\b|parkway|\bpkwy\b|\bcourtyard\b|\bloop\b|\btrail\b|\btrl\b)/;
  var DIRN = /\b(north|south|east|west|\bn\b|\bs\b|\be\b|\bw\b|ne|nw|se|sw)\b/;
  function looksLikeAddress(name) {
    var s = String(name).toLowerCase();
    if (/\d{4,}/.test(s)) return true;                 // 4+ digit run (zip / long number)
    if (STREET.test(s)) return true;                   // any street-type word
    if (/\d{1,6}\s*[a-z]/.test(s)) return true;        // number next to letters ("12 oak", "7b")
    if (/[a-z]\s*\d{1,6}/.test(s) && DIRN.test(s)) return true;
    return false;
  }

  function isBanned(name) {
    var acro = fold(name).replace(/[^a-z]/g, "");
    if (ACRO.indexOf(acro) !== -1) return true;   // exact short-code names
    // neo-nazi number codes: 1488 / 14-88, or 88 on its own
    if (/14\D{0,3}88/.test(name) || /^\W*88\W*$/.test(name)) return true;
    // 271 and 336, also split up ("2 7 1", "3.3.6") or with l / i / ! for the 1
    var digits = fold(name).replace(/[\s._\-,:;'"*~+=\/\\]/g, "");
    if (/27[1li!|]/.test(digits) || /336/.test(digits)) return true;
    var n = normName(name);
    if (n) {
      var c = collapse(n), p = soundAlike(n), pc = collapse(p);
      if (WHOLE.indexOf(n) !== -1 || WHOLE.indexOf(c) !== -1 || WHOLE.indexOf(pc) !== -1) return true;
      if (contains(n, BANNED) || contains(c, BANNED_COLLAPSED)) return true;
      if (contains(p, SOUND_ROOTS) || contains(pc, SOUND_ROOTS)) return true;
      if (contains(reverse(n), REVERSED)) return true;   // spelled backwards
      if (fuzzyHit(n) || fuzzyHit(c) || fuzzyHit(p) || fuzzyHit(pc)) return true;
      var d = n;
      for (var i = 0; i < DEEP_SAFE.length; i++) d = d.split(DEEP_SAFE[i]).join("-");
      var dp = soundAlike(d);
      if (deepHit(d) || deepHit(collapse(d)) || deepHit(dp) || deepHit(collapse(dp))) return true;
    }
    return looksLikeAddress(name);
  }

  // Names only the dev may use (they get it through the dev code, never by
  // typing it). Caught through leet, look-alikes, stretching, a capital I or
  // 1 for the l, and any one-letter misspelling.
  var RESERVED = ["lennon"];
  var RESERVED_SAFE = ["lennox", "rhiannon", "brennon"];
  function isReserved(name) {
    var n = normName(name);
    for (var i = 0; i < RESERVED_SAFE.length; i++) n = n.split(RESERVED_SAFE[i]).join("-");
    var l = n.replace(/i/g, "l");                       // "Iennon" / "1ennon"
    var forms = [n, collapse(n), l, collapse(l)];
    for (var f = 0; f < forms.length; f++) {
      var s = forms[f];
      for (var r = 0; r < RESERVED.length; r++) {
        var w = RESERVED[r], L = w.length;
        if (s.indexOf(collapse(w)) !== -1) return true;  // "lenon", "lennnnon"
        for (var j = 0; j < s.length; j++) {
          for (var len = L - 1; len <= L + 1; len++) {
            if (j + len <= s.length && oneEdit(s.substr(j, len), w)) return true;
          }
        }
      }
    }
    return false;
  }

  // The dev and mod codes are kept only as SHA-256 hashes, so the page source
  // never contains them. The dev code is folded with normName first (case,
  // spaces, symbols and leet don't matter); the mod code only drops spaces.
  // Resolves to "dev", "mod" or null.
  var DEV_HASH = "67ca17edac6de25aeed964646479ae2555785a8f495350da4106ea4991499da1";
  var MOD_HASH = "c88d80d972d8440efa3f02e0d545053957f3c739187f9eb7825d3e10daec7b39";
  function sha256(s) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode("edudeck:" + s)).then(function (buf) {
      var b = new Uint8Array(buf), hex = "";
      for (var i = 0; i < b.length; i++) hex += (b[i] < 16 ? "0" : "") + b[i].toString(16);
      return hex;
    });
  }
  function checkCode(raw) {
    if (!raw || !window.crypto || !crypto.subtle) return Promise.resolve(null);
    return Promise.all([sha256(normName(raw)), sha256(String(raw).replace(/\s+/g, ""))]).then(function (h) {
      return h[0] === DEV_HASH ? "dev" : h[1] === MOD_HASH ? "mod" : null;
    }, function () { return null; });
  }

  window.EduNameFilter = { isBanned: isBanned, isReserved: isReserved, normName: normName, checkCode: checkCode };
})();
