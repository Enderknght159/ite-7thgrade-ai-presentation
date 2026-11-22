/* ==========================================================
   Interactive demos — every "AI answer" is pre-written and
   replayed with typing / thinking animations.
   ========================================================== */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var ar = function (n) { return window.Deck ? Deck.ar(n) : String(n); };

  var TOKEN = 0;
  var alive = function (t) { return t === TOKEN; };

  function addBubble(body, who, html) {
    var b = document.createElement('div');
    b.className = 'bubble ' + who;
    if (html != null) b.innerHTML = html;
    body.appendChild(b);
    body.scrollTop = body.scrollHeight;
    return b;
  }

  function typingBubble(body) {
    var b = document.createElement('div');
    b.className = 'bubble ai typing';
    b.innerHTML = '<i></i><i></i><i></i>';
    body.appendChild(b);
    body.scrollTop = body.scrollHeight;
    return b;
  }

  async function think(body, ms, t) {
    var b = typingBubble(body);
    await sleep(ms);
    if (!alive(t)) { b.remove(); return false; }
    b.remove();
    return true;
  }

  async function typeUser(body, text, t, speed) {
    var b = addBubble(body, 'user', '');
    b.classList.add('prompt');
    var step = speed || 14;
    for (var i = 0; i < text.length; i++) {
      if (!alive(t)) return null;
      b.textContent += text.charAt(i);
      body.scrollTop = body.scrollHeight;
      await sleep(step);
    }
    return b;
  }

  function fmtMath(s) {
    return String(s).replace('٣/٤ + ١/٢', '<span class="math-inline" dir="ltr">٣/٤ + ١/٢</span>');
  }

  /* ==========================================================
     1 — CAT DEMO
     ========================================================== */
  var catAwarded = false;
  function catReset() {
    catAwarded = false;
    var box = $('#catNew');
    if (!box) return;
    box.classList.remove('is-done', 'is-scan');
    $('#catAnswer').innerHTML = '؟';
    var btn = $('#catBtn');
    btn.disabled = false;
    btn.innerHTML = '<svg class="ico"><use href="#i-spark"/></svg> جرّب صورة جديدة';
  }
  function initCat() {
    catReset();
    var btn = $('#catBtn');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', function () {
      var box = $('#catNew');
      var t = TOKEN;
      btn.disabled = true;
      box.classList.remove('is-done');
      box.classList.add('is-scan');
      $('#catAnswer').innerHTML = '؟';
      setTimeout(function () {
        if (!alive(t)) return;
        box.classList.remove('is-scan');
        box.classList.add('is-done');
        $('#catAnswer').innerHTML = 'قطة!<br><small>٩٦٪</small>';
        btn.disabled = false;
        btn.innerHTML = '<svg class="ico"><use href="#i-refresh"/></svg> صورة أخرى';
        if (!catAwarded) {
          catAwarded = true;
          Deck.addXP(5, 'تعرّف ناجح');
        }
      }, 1450);
    });
  }

  /* ==========================================================
     2 — HOW IT LEARNS
     ========================================================== */
  var LEARN_LINES = {
    1: 'يُعطى النظام بيانات كثيرة: صور، ونصوص، وأصوات، وأرقام.',
    2: 'يبحث عن القواسم المشتركة والتكرارات في الأمثلة.',
    3: 'يجرّب الإجابة… ثم تُصحَّح له حتى يتحسّن أداؤه.',
    4: 'يستخدم ما تعلّمه في مثال جديد لم يره من قبل.'
  };
  var learnTimer = null;
  var learnAwarded = false;

  function setLearnStep(n) {
    $$('#learnRail .learn-tab').forEach(function (b) {
      b.classList.toggle('is-on', +b.dataset.step === n);
    });
    $$('#learnStage .stage-pane').forEach(function (p) {
      p.classList.toggle('is-on', +p.dataset.pane === n);
    });
    $('#learnLine').textContent = LEARN_LINES[n];
    $('#learnProgress').style.width = (n / 4 * 100) + '%';
  }
  function stopLearn() {
    if (learnTimer) { clearTimeout(learnTimer); learnTimer = null; }
    $('#learnPlay').innerHTML = '<svg class="ico"><use href="#i-play"/></svg> شغّل الرحلة';
  }
  function initLearn() {
    stopLearn();
    learnAwarded = false;
    setLearnStep(1);
    var tabs = $('#learnRail');
    if (tabs && !tabs.dataset.bound) {
      tabs.dataset.bound = '1';
      tabs.addEventListener('click', function (e) {
        var b = e.target.closest('.learn-tab');
        if (!b) return;
        stopLearn();
        setLearnStep(+b.dataset.step);
      });
    }
    var play = $('#learnPlay');
    if (play && !play.dataset.bound) {
      play.dataset.bound = '1';
      play.addEventListener('click', function () {
        if (learnTimer) { stopLearn(); return; }
        var n = 1;
        setLearnStep(1);
        play.innerHTML = '<svg class="ico"><use href="#i-x"/></svg> إيقاف';
        learnTimer = setInterval(function () {
          n++;
          setLearnStep(n);
          if (n === 4) {
            clearInterval(learnTimer);
            learnTimer = null;
            play.innerHTML = '<svg class="ico"><use href="#i-refresh"/></svg> أعد الرحلة';
            if (!learnAwarded) {
              learnAwarded = true;
              Deck.addXP(10, 'فهمت الخطوات');
            }
            setTimeout(function () { play.innerHTML = '<svg class="ico"><use href="#i-play"/></svg> شغّل الرحلة'; }, 3200);
          }
        }, 2000);
      });
    }
  }

  /* ==========================================================
     3 — IS IT AI?
     ========================================================== */
  var iqDone = 0, iqAwarded = false;
  function initIQ() {
    iqDone = 0; iqAwarded = false;
    $$('#iqGrid .iq').forEach(function (c) { c.classList.remove('is-flipped'); });
    $('#iqCount').textContent = '٠ من ٦';
    var msg = $('#iqMsg');
    msg.textContent = 'اقلب البطاقات الست…';
    msg.classList.remove('done');
    var grid = $('#iqGrid');
    if (grid.dataset.bound) return;
    grid.dataset.bound = '1';
    grid.addEventListener('click', function (e) {
      var card = e.target.closest('.iq');
      if (!card || card.classList.contains('is-flipped')) return;
      card.classList.add('is-flipped');
      iqDone++;
      $('#iqCount').textContent = ar(iqDone) + ' من ٦';
      if (iqDone === 6 && !iqAwarded) {
        iqAwarded = true;
        msg.textContent = 'أحسنت! ميّزت الأنظمة المتعلّمة من غيرها.';
        msg.classList.add('done');
        Deck.addXP(15, 'خبير تصنيف');
        Deck.confetti(36);
      }
    });
  }

  /* ==========================================================
     4 — AI MISTAKE
     ========================================================== */
  var MISTAKE_PROMPT = 'ما ناتج ٧ × ٨؟';
  var mistakeAwarded = false;
  function mistakeReset() {
    mistakeAwarded = false;
    var body = $('#mistakeBody');
    if (!body) return;
    body.innerHTML = '';
    $$('#mistakeOpts button').forEach(function (b) {
      b.disabled = true;
      b.classList.remove('is-right', 'is-wrong');
    });
    var msg = $('#mistakeMsg');
    msg.textContent = 'انتظر الجواب…';
    msg.classList.remove('good');
    $('#mistakeTip').hidden = true;
  }
  async function playMistake(t) {
    var body = $('#mistakeBody');
    await sleep(350);
    if (!alive(t)) return;
    await typeUser(body, MISTAKE_PROMPT, t, 45);
    if (!alive(t)) return;
    await think(body, 900, t);
    if (!alive(t)) return;
    var b = addBubble(body, 'ai', '<span dir="ltr">٧ × ٨ = <b class="bad-answer" id="badAnswer">٥٤</b></span>');
    var tag = document.createElement('small');
    tag.className = 'confident';
    tag.innerHTML = 'ثقة عالية · إجابة فورية';
    b.appendChild(tag);
    body.scrollTop = body.scrollHeight;
    $$('#mistakeOpts button').forEach(function (x) { x.disabled = false; });
    $('#mistakeMsg').textContent = 'الآن… أين الخطأ؟';
  }
  function initMistake(t) {
    mistakeReset();
    var opts = $('#mistakeOpts');
    if (!opts.dataset.bound) {
      opts.dataset.bound = '1';
      opts.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b || b.disabled) return;
        var msg = $('#mistakeMsg');
        if (b.dataset.v === '56') {
          b.classList.add('is-right');
          $$('#mistakeOpts button').forEach(function (x) { x.disabled = true; });
          var bad = $('#badAnswer');
          if (bad) { bad.style.textDecoration = 'line-through'; bad.style.color = 'var(--red-dark)'; }
          msg.textContent = 'صحيح! ٧ × ٨ = ٥٦. الجواب السابق كان خاطئًا… رغم ثقته.';
          msg.classList.add('good');
          $('#mistakeTip').hidden = false;
          if (!mistakeAwarded) {
            mistakeAwarded = true;
            Deck.addXP(10, 'اكتشفت الخطأ');
          }
          if (window.innerWidth > 720) Deck.confetti(26);
        } else {
          b.classList.add('is-wrong');
          b.disabled = true;
          msg.textContent = 'ليست هذه… أعد الحساب بهدوء.';
          msg.classList.remove('good');
        }
      });
    }
    playMistake(t);
  }

  /* ==========================================================
     5 — RULES
     ========================================================== */
  var rulesSeen = new Set(), rulesAwarded = false;
  function initRules() {
    rulesSeen = new Set(); rulesAwarded = false;
    $$('#rules .rule').forEach(function (r) { r.classList.remove('is-open'); });
    $('#rulesCount').textContent = '٠ من ٦';
    var msg = $('#rulesMsg');
    msg.textContent = 'افتح القواعد الست…';
    msg.classList.remove('done');
    var box = $('#rules');
    if (box.dataset.bound) return;
    box.dataset.bound = '1';
    box.addEventListener('click', function (e) {
      var r = e.target.closest('.rule');
      if (!r) return;
      var opening = !r.classList.contains('is-open');
      r.classList.toggle('is-open');
      if (opening) {
        rulesSeen.add(r.dataset.q || Array.prototype.indexOf.call(box.children, r));
        $('#rulesCount').textContent = ar(rulesSeen.size) + ' من ٦';
      }
      if (rulesSeen.size === 6 && !rulesAwarded) {
        rulesAwarded = true;
        msg.textContent = 'ست قواعد… وأنت الآن مستخدم واعٍ.';
        msg.classList.add('done');
        Deck.addXP(15, 'دستور الذكاء');
        Deck.confetti(36);
      }
    });
  }

  /* ==========================================================
     6 — RECIPE
     ========================================================== */
  var recipeSeen = new Set(), recipeAwarded = false;
  function initRecipe() {
    recipeSeen = new Set(); recipeAwarded = false;
    $$('#recipe .ing').forEach(function (b) { b.classList.remove('is-on'); });
    $('#rdBody').hidden = true;
    $('#rdEmpty').hidden = false;
    $('#recipeFull').hidden = true;
    $('#rdCount').textContent = '٠ من ٨';
    var box = $('#recipe');
    if (box.dataset.bound) return;
    box.dataset.bound = '1';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.ing');
      if (!b) return;
      $$('#recipe .ing').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      $('#rdEmpty').hidden = true;
      $('#rdBody').hidden = false;
      $('#rdName').textContent = b.dataset.name;
      $('#rdEx').textContent = b.dataset.ex;
      recipeSeen.add(b.dataset.name);
      $('#rdCount').textContent = ar(recipeSeen.size) + ' من ٨';
      if (recipeSeen.size === 8 && !recipeAwarded) {
        recipeAwarded = true;
        $('#recipeFull').hidden = false;
        Deck.addXP(20, 'وصفة مكتملة');
        Deck.confetti(40);
      }
    });
  }

  /* ==========================================================
     7 — PROMPT BUILDER
     ========================================================== */
  var buildBusy = false, buildAwarded = false;
  function buildFrags() {
    return $$('#buildChips .bchip').filter(function (b) { return b.classList.contains('is-on'); })
      .map(function (b) { return b.dataset.frag; });
  }
  function paintBuild() {
    var frags = buildFrags();
    var n = frags.length;
    var txt = $('#buildText');
    if (n === 0) {
      txt.textContent = 'اكتب طلبك… أو اختر عناصر من اليمين.';
      txt.classList.remove('has-text');
    } else {
      txt.innerHTML = fmtMath(frags.join(' '));
      txt.classList.add('has-text');
      txt.scrollTop = txt.scrollHeight;
    }
    $('#buildCount').textContent = ar(n) + ' من ٨';
    $('#buildMeter').style.width = (n / 8 * 100) + '%';
  }
  function buildReset() {
    buildBusy = false; buildAwarded = false;
    $$('#buildChips .bchip').forEach(function (b) { b.classList.remove('is-on'); });
    paintBuild();
    var chat = $('#buildChat');
    chat.innerHTML = '<div class="bubble ai">اختر عناصر الطلب… ثم أرسله لي. سأكون دقيقًا بقدر ما تكون واضحًا.</div>';
    $('#buildHint').textContent = 'الطلب الناقص = إجابة ناقصة.';
    $('#buildSend').disabled = false;
  }
  function initBuilder() {
    buildReset();
    var chips = $('#buildChips');
    if (!chips.dataset.bound) {
      chips.dataset.bound = '1';
      chips.addEventListener('click', function (e) {
        var b = e.target.closest('.bchip');
        if (!b || buildBusy) return;
        b.classList.toggle('is-on');
        paintBuild();
      });
    }
    var send = $('#buildSend');
    if (!send.dataset.bound) {
      send.dataset.bound = '1';
      send.addEventListener('click', async function () {
        if (buildBusy) return;
        var frags = buildFrags();
        if (!frags.length) {
          Deck.toast('اختر عنصرًا واحدًا على الأقل');
          return;
        }
        var t = TOKEN;
        buildBusy = true;
        send.disabled = true;
        var chat = $('#buildChat');
        addBubble(chat, 'user', fmtMath(frags.join(' '))).classList.add('prompt');
        chat.scrollTop = chat.scrollHeight;
        await sleep(250);
        if (!alive(t)) { buildBusy = false; send.disabled = false; return; }
        await think(chat, 850, t);
        if (!alive(t)) { buildBusy = false; send.disabled = false; return; }

        var n = frags.length;
        if (n >= 5) {
          addBubble(chat, 'ai',
            'ممتاز، الطلب واضح. لنبدأ بتلميحات:<br>' +
            '١) المقام المشترك للعددين ٤ و٢ هو ٤.<br>' +
            '٢) حوّل <span class="math-inline" dir="ltr">١/٢</span> إلى <span class="math-inline" dir="ltr">٢/٤</span>.<br>' +
            '٣) الآن اجمع <span class="math-inline" dir="ltr">٣/٤ + ٢/٤</span> بنفسك.<br>' +
            'أنا لن أكمل بدلًا عنك… لأنك طلبت ذلك.'
          );
          $('#buildHint').textContent = 'الطلب الكامل = إجابة دقيقة وخطوات واضحة.';
          if (!buildAwarded) {
            buildAwarded = true;
            Deck.addXP(15, 'طلب احترافي');
            Deck.confetti(30);
          }
        } else {
          addBubble(chat, 'ai',
            'أهلًا! أحتاج تفاصيل أكثر:<br>ما المسألة؟ وما مستواك؟ وبأي شكل تريد الإجابة؟<br>' +
            'أضف عناصر أخرى من اليمين.'
          );
          $('#buildHint').textContent = 'لاحظ: طلب ناقص = إجابة ناقصة.';
        }
        buildBusy = false;
        send.disabled = false;
      });
    }
    var reset = $('#buildReset');
    if (!reset.dataset.bound) {
      reset.dataset.bound = '1';
      reset.addEventListener('click', buildReset);
    }
  }

  /* ==========================================================
     8 — MATH SIMULATION
     ========================================================== */
  var MATH_PROMPT = 'أنت معلم صبور، ساعدني في حل المسألة بتلميحات، ولا تعطني الجواب النهائي، واشرح بمستوى الصف السابع، واعرض النتيجة في خطوات.';
  var mathSteps = [
    {
      q: 'تلميح أول: ما المقام المشترك للعددين ٤ و٢؟',
      opts: ['٢', '٤', '٨'],
      right: '٤',
      ok: 'تمام! المقام المشترك هو ٤.',
      hint: 'فكّر في المضاعفات: ٤، ٨، ١٢… و٢، ٤، ٦…'
    },
    {
      q: 'حوّل <span class="math-inline" dir="ltr">١/٢</span> إلى كسر مقامه ٤. كم يصبح؟',
      opts: ['١/٤', '٢/٤', '٣/٤'],
      right: '٢/٤',
      ok: 'أحسنت! <span class="math-inline" dir="ltr">١/٢ = ٢/٤</span> لأن البسط والمقام ضُربا في ٢.',
      hint: 'اضرب البسط والمقام في العدد نفسه.'
    },
    {
      q: 'الآن اجمع: <span class="math-inline" dir="ltr">٣/٤ + ٢/٤</span> = ؟',
      opts: ['٥/٤', '٥/٨', '٦/٤'],
      right: '٥/٤',
      ok: 'ممتاز! <span class="math-inline" dir="ltr">٥/٤ = ١ و١/٤</span>. وصلت بنفسك… وهذا هو الهدف.',
      hint: 'المقام يبقى ٤… واجمع البسطين فقط.'
    }
  ];
  var mathState = { step: 0, gen: 0, busy: false, awarded: false };

  function mathReset() {
    mathState = { step: 0, gen: mathState.gen + 1, busy: false, awarded: false };
    var chat = $('#mathChat');
    if (!chat) return;
    chat.innerHTML = '<div class="bubble ai">جاهز! اضغط «أرسل طلبي»… وسأبدأ بتلميح صغير.</div>';
    $('#mathChoices').innerHTML = '';
    $('#mathStart').disabled = false;
  }
  function mathChoices(step, gen) {
    var bar = $('#mathChoices');
    bar.innerHTML = '';
    step.opts.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = o;
      b.addEventListener('click', function () {
        if (gen !== mathState.gen || b.disabled) return;
        if (o === step.right) {
          b.classList.add('right');
          $$('#mathChoices button').forEach(function (x) { x.disabled = true; });
          addBubble($('#mathChat'), 'ai', step.ok);
          if (mathState.step === mathSteps.length - 1) {
            setTimeout(function () {
              if (gen !== mathState.gen) return;
              addBubble($('#mathChat'), 'ai', '🎯 انتهت التلميحات. اكتب الحل كاملًا في دفترك… وقارنه بالكتاب.');
              if (!mathState.awarded) {
                mathState.awarded = true;
                Deck.addXP(20, 'حللت بتلميحات');
                Deck.confetti(44);
              }
            }, 800);
          } else {
            mathState.step++;
            setTimeout(function () {
              if (gen !== mathState.gen) return;
              mathAsk(gen);
            }, 1000);
          }
        } else {
          b.classList.add('wrong');
          b.disabled = true;
          addBubble($('#mathChat'), 'ai', step.hint || 'حاول مرة أخرى…');
        }
      });
      bar.appendChild(b);
    });
  }
  function mathAsk(gen) {
    if (gen !== mathState.gen) return;
    var step = mathSteps[mathState.step];
    var chat = $('#mathChat');
    addBubble(chat, 'ai', '<b>السؤال ' + ar(mathState.step + 1) + ':</b> ' + step.q);
    mathChoices(step, gen);
  }
  async function mathStart(t, gen) {
    if (mathState.busy) return;
    mathState.busy = true;
    $('#mathStart').disabled = true;
    var chat = $('#mathChat');
    chat.innerHTML = '';
    await typeUser(chat, MATH_PROMPT, t, 9);
    if (!alive(t) || gen !== mathState.gen) return;
    await think(chat, 900, t);
    if (!alive(t) || gen !== mathState.gen) return;
    mathState.step = 0;
    mathAsk(gen);
    mathState.busy = false;
  }
  function initMath() {
    mathReset();
    var start = $('#mathStart');
    if (!start.dataset.bound) {
      start.dataset.bound = '1';
      start.addEventListener('click', function () {
        mathStart(TOKEN, mathState.gen);
      });
    }
    var reset = $('#mathReset');
    if (!reset.dataset.bound) {
      reset.dataset.bound = '1';
      reset.addEventListener('click', function () {
        mathReset();
        Deck.toast('جاهز من جديد');
      });
    }
  }

  /* ==========================================================
     9 — ARABIC SIMULATION
     ========================================================== */
  var AR_PROMPT = 'أنت معلم لغة عربية صبور. اسألني ثلاثة أسئلة متدرجة عن الفعل المضارع، سؤالًا واحدًا في كل مرة، وصحّح إجابتي مع السبب.';
  var arSteps = [
    {
      q: 'السؤال ١: أي جملة فيها فعل مضارع؟',
      opts: ['كتبَ الطالبُ درسَه', 'يكتبُ الطالبُ درسَه', 'اكتبْ درسَك'],
      right: 'يكتبُ الطالبُ درسَه',
      ok: 'صحيح! «يكتبُ» فعل مضارع؛ لأنه يدل على حدث يجري الآن أو في المستقبل.',
      hint: 'المضارع يبدأ بأحد حروف: أ، ن، ي، ت.'
    },
    {
      q: 'السؤال ٢: ما علامة رفع «يكتبون» في: الطلابُ يكتبون؟',
      opts: ['الضمة', 'ثبوت النون', 'الفتحة'],
      right: 'ثبوت النون',
      ok: 'أحسنت! الأفعال الخمسة تُرفع بثبوت النون.',
      hint: 'راجع علامات إعراب الأفعال الخمسة.'
    },
    {
      q: 'السؤال ٣: حوّل «هو يكتب» إلى جمع.',
      opts: ['هم يكتبون', 'هم كتبوا', 'هم يكتبان'],
      right: 'هم يكتبون',
      ok: 'ممتاز! <b>٣ من ٣</b>. ولاحظ: سألتك سؤالًا واحدًا في كل مرة… كما طلبت.',
      hint: 'الجمع للعاقل الغائب: هم + فعل مضارع.'
    }
  ];
  var arState = { step: 0, gen: 0, busy: false, awarded: false };

  function arReset() {
    arState = { step: 0, gen: arState.gen + 1, busy: false, awarded: false };
    var chat = $('#arChat');
    if (!chat) return;
    chat.innerHTML = '<div class="bubble ai">اسألني ما تشاء… سأبدأ بسؤال واحد فقط.</div>';
    $('#arChoices').innerHTML = '';
    $('#arStart').disabled = false;
  }
  function arChoices(step, gen) {
    var bar = $('#arChoices');
    bar.innerHTML = '';
    step.opts.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = o;
      b.addEventListener('click', function () {
        if (gen !== arState.gen || b.disabled) return;
        if (o === step.right) {
          b.classList.add('right');
          $$('#arChoices button').forEach(function (x) { x.disabled = true; });
          addBubble($('#arChat'), 'ai', step.ok);
          if (arState.step === arSteps.length - 1) {
            setTimeout(function () {
              if (gen !== arState.gen) return;
              addBubble($('#arChat'), 'ai', 'انتهى التدريب. أعد كتابة القاعدة بأسلوبك… ثم راجعها من الكتاب.');
              if (!arState.awarded) {
                arState.awarded = true;
                Deck.addXP(20, 'أتقنت المضارع');
                Deck.confetti(44);
              }
            }, 850);
          } else {
            arState.step++;
            setTimeout(function () {
              if (gen !== arState.gen) return;
              arAsk(gen);
            }, 1050);
          }
        } else {
          b.classList.add('wrong');
          b.disabled = true;
          addBubble($('#arChat'), 'ai', step.hint || 'حاول مرة أخرى…');
        }
      });
      bar.appendChild(b);
    });
  }
  function arAsk(gen) {
    if (gen !== arState.gen) return;
    var step = arSteps[arState.step];
    var chat = $('#arChat');
    addBubble(chat, 'ai', '<b>' + step.q + '</b>');
    arChoices(step, gen);
  }
  async function arStart(t, gen) {
    if (arState.busy) return;
    arState.busy = true;
    $('#arStart').disabled = true;
    var chat = $('#arChat');
    chat.innerHTML = '';
    await typeUser(chat, AR_PROMPT, t, 9);
    if (!alive(t) || gen !== arState.gen) return;
    await think(chat, 900, t);
    if (!alive(t) || gen !== arState.gen) return;
    arState.step = 0;
    arAsk(gen);
    arState.busy = false;
  }
  function initArabic() {
    arReset();
    var start = $('#arStart');
    if (!start.dataset.bound) {
      start.dataset.bound = '1';
      start.addEventListener('click', function () { arStart(TOKEN, arState.gen); });
    }
    var reset = $('#arReset');
    if (!reset.dataset.bound) {
      reset.dataset.bound = '1';
      reset.addEventListener('click', function () {
        arReset();
        Deck.toast('جاهز من جديد');
      });
    }
  }

  /* ==========================================================
     10 — SAME TOOL, DIFFERENT REQUEST
     ========================================================== */
  var SUBJECTS = {
    math: {
      name: 'الرياضيات', icon: '#i-number',
      role: 'معلم رياضيات صبور',
      task: 'ساعدني في حل مسألة جمع الكسور بتلميحات متدرجة',
      shape: 'خطوات قصيرة، وتلميح بعد كل خطوة… بلا جواب نهائي',
      why: 'الهدف: فهم طريقة الحل، لا الحصول على الجواب.'
    },
    bio: {
      name: 'الأحياء', icon: '#i-flask',
      role: 'معلم أحياء مبسّط',
      task: 'اشرح درس الخلية بأمثلة تدريجية، واختبر فهمي بعد كل مثال',
      shape: 'تشبيه من الحياة، ثم سؤال قصير بعد كل جزء',
      why: 'الهدف: فهم وظائف مكونات الخلية.'
    },
    ar: {
      name: 'اللغة العربية', icon: '#i-text',
      role: 'معلم لغة عربية صبور',
      task: 'اسألني خمسة أسئلة متدرجة عن الفعل المضارع وصحّح إجاباتي',
      shape: 'سؤال واحد في كل مرة، ثم تصحيح مع بيان السبب',
      why: 'الهدف: مراجعة القاعدة وفهم أسباب الخطأ.'
    },
    en: {
      name: 'اللغة الإنجليزية', icon: '#i-translate',
      role: 'معلم لغة إنجليزية صبور',
      task: 'تحدّث معي عن عطلتي بجمل بسيطة وصحّح أخطائي',
      shape: 'محادثة قصيرة، سؤال واحد في كل مرة، ثم تصحيح',
      why: 'الهدف: التدرب على تكوين جمل بسيطة بنفسي.'
    },
    hist: {
      name: 'التاريخ', icon: '#i-book',
      role: 'معلم تاريخ مبسّط',
      task: 'لخّص درس الحضارة المصرية القديمة في جدول زمني',
      shape: 'جدول من ثلاثة أعمدة: الحدث، التاريخ التقريبي، الأثر',
      why: 'الهدف: فهم تسلسل الأحداث وأسبابها ونتائجها.'
    }
  };
  var subjSeen = new Set(), subjAwarded = false;
  function pickSubject(key) {
    var d = SUBJECTS[key];
    if (!d) return;
    $('#subjName').textContent = d.name;
    $('#subjIco').innerHTML = '<svg class="ico"><use href="' + d.icon + '"/></svg>';
    $('#subjRole').textContent = d.role;
    $('#subjTask').textContent = d.task;
    $('#subjShape').textContent = d.shape;
    $('#subjWhy').textContent = d.why;
    var card = $('#subjCard');
    card.classList.remove('is-swap');
    void card.offsetWidth;
    card.classList.add('is-swap');
    $$('#subjectTabs .subj').forEach(function (b) { b.classList.toggle('is-on', b.dataset.s === key); });
    subjSeen.add(key);
    if (subjSeen.size === 5 && !subjAwarded) {
      subjAwarded = true;
      Deck.addXP(10, 'خمس مواد');
    }
  }
  function initSubjects() {
    subjSeen = new Set(); subjAwarded = false;
    pickSubject('math');
    var tabs = $('#subjectTabs');
    if (tabs.dataset.bound) return;
    tabs.dataset.bound = '1';
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('.subj');
      if (b) pickSubject(b.dataset.s);
    });
  }

  /* ==========================================================
     11 — INPUT QUALITY
     ========================================================== */
  var inputMode = 'clear';
  var inputSeen = new Set(), inputAwarded = false;

  function setInputMode(mode) {
    inputMode = mode;
    var paper = $('#paper');
    paper.classList.toggle('is-blur', mode === 'blur');
    paper.classList.toggle('is-text', mode === 'text');
    $$('#inputModes .mode').forEach(function (b) { b.classList.toggle('is-on', b.dataset.mode === mode); });
    var p = $('.paper-math');
    if (mode === 'text') {
      p.innerHTML = '<span dir="ltr" style="font-size:.62em;color:#1c86c9">٣/٤ + ١/٢ = ؟</span>';
    } else {
      p.innerHTML = '<span class="frac"><b>٣</b><b>٤</b></span> + <span class="frac"><b>١</b><b>٢</b></span> = ؟';
    }
  }
  function initInput() {
    inputSeen = new Set(); inputAwarded = false;
    setInputMode('clear');
    $('#inputChat').innerHTML = '<div class="bubble ai">أرسل الصورة… وسأخبرك بما أرى.</div>';
    var modes = $('#inputModes');
    if (!modes.dataset.bound) {
      modes.dataset.bound = '1';
      modes.addEventListener('click', function (e) {
        var b = e.target.closest('.mode');
        if (b) setInputMode(b.dataset.mode);
      });
    }
    var send = $('#inputSend');
    if (!send.dataset.bound) {
      send.dataset.bound = '1';
      send.addEventListener('click', async function () {
        var t = TOKEN;
        var chat = $('#inputChat');
        var mode = inputMode;
        chat.innerHTML = '';
        send.disabled = true;
        if (mode === 'blur') {
          addBubble(chat, 'user', '<svg class="ico" style="width:18px;height:18px;vertical-align:-4px"><use href="#i-camera"/></svg> أرسلت صورة للمسألة…');
        } else if (mode === 'text') {
          addBubble(chat, 'user', '<span class="prompt">٣/٤ + ١/٢ = ؟</span>');
        } else {
          addBubble(chat, 'user', '<svg class="ico" style="width:18px;height:18px;vertical-align:-4px"><use href="#i-camera"/></svg> أرسلت صورة واضحة للمسألة.');
        }
        await think(chat, 850, t);
        if (!alive(t)) { send.disabled = false; return; }
        if (mode === 'clear') {
          addBubble(chat, 'ai', 'أرى المسألة بوضوح: <span class="math-inline" dir="ltr">٣/٤ + ١/٢</span>. الصورة حادة والإضاءة جيدة… هل نبدأ بتوحيد المقامات؟');
        } else if (mode === 'blur') {
          addBubble(chat, 'ai', 'الصورة غير واضحة… هل المقام ٢ أم ٣؟ لا أستطيع قراءة الأرقام بدقة. أعد التصوير بإضاءة أفضل، أو أرسل النص.');
        } else {
          addBubble(chat, 'ai', 'النص واضح تمامًا: <span class="math-inline" dir="ltr">٣/٤ + ١/٢</span>. النص أدق من الصورة، لأنني أقرؤه مباشرة بلا أخطاء.');
        }
        if (!inputSeen.has(mode)) {
          inputSeen.add(mode);
          Deck.addXP(5, 'جرّبت إدخالًا');
        }
        if (inputSeen.size === 3 && !inputAwarded) {
          inputAwarded = true;
          Deck.addXP(10, 'خبير إدخال');
          Deck.toast('تذكّر: لا ترسل اسمك أو معلوماتك الشخصية');
          if (window.innerWidth > 720) Deck.confetti(28);
        }
        send.disabled = false;
      });
    }
  }

  /* ==========================================================
     12 — QUIZ
     ========================================================== */
  var QUIZ = [
    {
      q: 'ما تعريف الذكاء الاصطناعي؟',
      opts: ['نظام يتعلّم من أمثلة كثيرة ويلاحظ الأنماط', 'آلة تنفّذ عمليات حسابية ثابتة', 'جهاز يخزّن الملفات فقط'],
      a: 0,
      why: 'الذكاء الاصطناعي يتعلّم من الأمثلة، ويلاحظ الأنماط، ثم يستخدمها في مهام جديدة.'
    },
    {
      q: 'أي مثال ليس ذكاءً اصطناعيًا؟',
      opts: ['ترجمة جوجل', 'فلاتر سناب شات', 'ساعة المنبّه'],
      a: 2,
      why: 'ساعة المنبّه تعمل وفق وقت محدّد مسبقًا… ولا تتعلّم من الأمثلة.'
    },
    {
      q: 'كيف يتعلّم الذكاء الاصطناعي؟',
      opts: ['يجمع أمثلة، يلاحظ أنماطًا، يحاول ويصحّح', 'يحفظ كل الإجابات مسبقًا', 'يسأل المعلم في كل مرة'],
      a: 0,
      why: 'الرحلة: بيانات ← أنماط ← محاولة وتصحيح ← استخدام في مثال جديد.'
    },
    {
      q: 'لماذا نراجع إجابة الذكاء الاصطناعي؟',
      opts: ['لأنه قد يخطئ رغم ثقته', 'لأنه لا يعرف القراءة', 'لأن الإنترنت يكون مقطوعًا دائمًا'],
      a: 0,
      why: 'قد يعطي إجابة خاطئة بثقة عالية… لذلك نتحقق من الكتاب أو المعلم.'
    },
    {
      q: 'أي طلب هو الأفضل؟',
      opts: ['«اشرح الخلية»', '«أنت معلم صبور، اشرح الخلية بمستوى الصف السابع، وفي خطوات»', '«أعطني الواجب جاهزًا»'],
      a: 1,
      why: 'الطلب الجيد يحدّد الدور والمهمة والمستوى والشكل… فتأتي الإجابة مناسبة.'
    },
    {
      q: 'أرسلتَ صورة ضبابية لمسألة. ماذا يحدث؟',
      opts: ['قد يقرأ AI أرقامًا خاطئة', 'يحلّها بدقة دائمًا', 'يرفض كل الصور'],
      a: 0,
      why: 'جودة الإدخال تحدّد جودة الإجابة. صورة واضحة أو نص دقيق = نتيجة أدق.'
    },
    {
      q: 'أي معلومة لا ترسلها إلى AI؟',
      opts: ['نص درسك', 'سؤال رياضيات', 'رقم هاتفك وكلمة مرورك'],
      a: 2,
      why: 'لا تشارك معلومات شخصية: الاسم الكامل، العنوان، الهاتف، كلمات المرور.'
    }
  ];
  var quizState = { i: 0, score: 0, finished: false, locked: false };

  function quizRender() {
    var body = $('#quizBody');
    if (!body) return;
    if (quizState.finished) {
      var pct = Math.round(quizState.score / QUIZ.length * 100);
      var msg = pct >= 85 ? 'ممتاز! أنت خبير ذكاء اصطناعي.' : pct >= 60 ? 'جيد جدًا… راجع القواعد البسيطة.' : 'لا بأس! أعد المحاولة بعد مراجعة المحطات.';
      body.innerHTML =
        '<div class="quiz-result">' +
        '<span class="score">' + ar(quizState.score) + ' من ' + ar(QUIZ.length) + '</span>' +
        '<p>' + msg + '</p>' +
        '<div class="actions">' +
        '<button class="btn btn-ghost" id="quizRetry"><svg class="ico"><use href="#i-refresh"/></svg> أعد الاختبار</button>' +
        '<button class="btn btn-primary" data-goto="recap">إلى الخلاصة <svg class="ico"><use href="#i-arrow-left"/></svg></button>' +
        '</div></div>';
      $('#quizBar').style.width = '100%';
      $('#quizCount').textContent = ar(QUIZ.length) + ' من ' + ar(QUIZ.length);
      $('#quizRetry').addEventListener('click', quizReset);
      if (quizState.score >= 6) Deck.confetti(50);
      return;
    }
    var q = QUIZ[quizState.i];
    var keys = ['أ', 'ب', 'ج', 'د'];
    body.innerHTML =
      '<div class="quiz-q">' + q.q + '</div>' +
      '<div class="quiz-opts">' + q.opts.map(function (o, i) {
        return '<button class="quiz-opt" data-i="' + i + '"><span class="key">' + keys[i] + '</span><span>' + o + '</span></button>';
      }).join('') + '</div>' +
      '<div class="quiz-feedback" id="quizFeedback"></div>' +
      '<div class="quiz-feedback" id="quizExplain"></div>' +
      '<button class="btn btn-primary btn-sm quiz-next" id="quizNext" hidden>التالي <svg class="ico"><use href="#i-arrow-left"/></svg></button>';

    var opts = $$('#quizBody .quiz-opt');
    opts.forEach(function (b) {
      b.addEventListener('click', function () {
        if (quizState.locked) return;
        quizState.locked = true;
        var pick = +b.dataset.i;
        var right = pick === q.a;
        opts.forEach(function (x, i) {
          x.disabled = true;
          if (i === q.a) x.classList.add('is-right');
        });
        if (!right) b.classList.add('is-wrong');
        if (right) {
          quizState.score++;
          Deck.addXP(10);
        }
        $('#quizScore').innerHTML = '<svg class="ico"><use href="#i-spark"/></svg> ' + ar(quizState.score * 10);
        $('#quizFeedback').textContent = right ? 'إجابة صحيحة!' : 'الإجابة الصحيحة هي: ' + q.opts[q.a];
        $('#quizFeedback').style.color = right ? 'var(--green-deep)' : 'var(--red-dark)';
        $('#quizExplain').textContent = q.why;
        var next = $('#quizNext');
        next.hidden = false;
        next.innerHTML = (quizState.i === QUIZ.length - 1 ? 'النتيجة' : 'التالي') + ' <svg class="ico"><use href="#i-arrow-left"/></svg>';
        next.addEventListener('click', function () {
          quizState.i++;
          quizState.locked = false;
          if (quizState.i >= QUIZ.length) { quizState.finished = true; }
          quizRender();
        });
      });
    });
    $('#quizCount').textContent = ar(quizState.i + 1) + ' من ' + ar(QUIZ.length);
    $('#quizBar').style.width = ((quizState.i) / QUIZ.length * 100) + '%';
  }
  function quizReset() {
    quizState = { i: 0, score: 0, finished: false, locked: false };
    quizRender();
  }
  function initQuiz() { quizReset(); }

  /* ==========================================================
     13 — WIRE UP
     ========================================================== */
  var ENTER = {
    'what-is-ai': initCat,
    'how-learns': initLearn,
    'is-it-ai': initIQ,
    'ai-mistake': initMistake,
    'rules': initRules,
    'recipe': initRecipe,
    'builder': initBuilder,
    'sim-math': initMath,
    'sim-arabic': initArabic,
    'same-tool': initSubjects,
    'input': initInput,
    'quiz': initQuiz
  };

  document.addEventListener('slide:enter', function (e) {
    TOKEN++;
    var fn = ENTER[e.detail.key];
    if (fn) fn(TOKEN);
  });
  document.addEventListener('slide:leave', function () {
    TOKEN++;
    stopLearn();
  });

  /* boot: handle a deck opened directly on a demo slide */
  var bootKey = (location.hash || '#cover').slice(1);
  if (ENTER[bootKey]) {
    TOKEN++;
    ENTER[bootKey](TOKEN);
  }
})();
