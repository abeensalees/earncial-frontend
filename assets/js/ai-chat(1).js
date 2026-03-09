/* ================================================================
   EARNCIAL AI CHAT WIDGET — FULL SCREEN ChatGPT STYLE
   ─────────────────────────────────────────────────────────────────
   HOW TO ADD TO ANY PAGE — paste before </body>:

      <!-- AI CHAT WIDGET START -->
      <link rel="stylesheet" href="ai-chat.css">
      <div id="earncial-chat-root"></div>
      <script src="ai-chat.js"></script>
      <!-- AI CHAT WIDGET END -->
   ================================================================ */
(function () {

  /* ══════════════════════════════════════════════════════════════
     KNOWLEDGE BASE — add/edit entries to teach Earni more
     keywords: phrases to match (lowercase)
     answer:   **bold**, \n for new line
     ══════════════════════════════════════════════════════════════ */
  var KB = [

    // ════════════════════════════════════════════════════════════
    //  GENERAL
    // ════════════════════════════════════════════════════════════

    // ── GREET ──────────────────────────────────────────────────
    { keywords: ['hello','hi','hey','good morning','good afternoon','good evening','how are you','what can you do','your name','sup'],
      answer: `Hey! 👋 I'm **Earni**, Earncial's AI assistant.\n\nAre you an **Earner** or an **Advertiser**?\n\n👤 **Earner** — I can help with:\n• Account activation, linking social handles\n• Performing tasks & submitting proof\n• Withdrawals & earnings\n\n📢 **Advertiser** — I can help with:\n• Depositing funds (Flutterwave)\n• Posting & managing tasks\n• Increasing participants, pausing, deleting tasks\n• Analytics\n\nJust type your question! 🚀` },

    // ── THANK YOU ──────────────────────────────────────────────
    { keywords: ['thank','thanks','thank you','helpful','great','awesome','perfect','nice','good job'],
      answer: `You're welcome! 😊 Happy to help!\n\nFeel free to ask anything else — I'm available 24/7. Happy earning! 💰` },

    // ── LOGIN / PASSWORD ───────────────────────────────────────
    { keywords: ['login','cant login','cannot login','forgot password','password reset','sign in problem','access denied','locked out'],
      answer: `**Login / Access Issues** 🔐\n\n1️⃣ Double-check your **email and password**\n2️⃣ Click **"Forgot Password"** on the login page\n3️⃣ Check your email inbox *(and spam/junk folder)* for the reset link\n4️⃣ Set a new password and try logging in again\n\n**Still locked out?**\nEmail 📧 **support@earncial.com** with:\n• Your registered email\n• What happened and when it started` },

    // ── CONTACT / HUMAN ────────────────────────────────────────
    { keywords: ['contact','human','agent','talk to','real person','email support','speak to someone','live support','support team'],
      answer: `**Reach Our Support Team** 🙋\n\n📧 **Email:** support@earncial.com\n🎫 **Submit a ticket:** Go to the **Support** page\n\n⏱️ We reply within **24 hours** — usually much faster!\n\n> 💡 For urgent issues, write **"URGENT"** in the subject line and include screenshots, amounts, and any Task IDs.` },

    // ── BUG / TECHNICAL ────────────────────────────────────────
    { keywords: ['bug','error','not working','problem','broken','crash','glitch','app issue','technical','slow','loading','page not'],
      answer: `**Technical Issues** 🐛\n\n**Try these first:**\n🔄 Refresh the page\n🧹 Clear your browser cache & cookies\n🌐 Try a different browser (Chrome, Firefox, Safari)\n📱 On mobile? Close the app fully and reopen\n🔌 Check your internet connection\n\n**Still not fixed?**\nSubmit a support ticket with:\n• Which page you were on\n• What you clicked/did\n• The exact error message\n• A screenshot if possible 📸` },

    // ── HOW LONG ───────────────────────────────────────────────
    { keywords: ['how long','waiting','pending','approval time','processing time','review time','how many hours','when will'],
      answer: `**Processing Times on Earncial** ⏱️\n\n🔵 **Account activation** → 1–2 hours\n🔵 **Handle verification** → 1–6 hours\n🔵 **Task proof approval** → 1–6 hours\n🔵 **Task review (advertisers)** → minutes to a few hours\n🔵 **Withdrawal** → a few seconds to 24 hours\n🔵 **Deposit (Flutterwave)** → automatic & instant\n🔵 **Support ticket reply** → within 24 hours\n\n> ⏳ During busy periods times may be slightly longer. Over 24 hours with no update? Submit a support ticket.` },

    // ════════════════════════════════════════════════════════════
    //  EARNER — ACCOUNT
    // ════════════════════════════════════════════════════════════

    // ── ACTIVATION ─────────────────────────────────────────────
    { keywords: ['activation','activate account','activation fee','1000','one time','how to activate','not activated','activate my account','pay activation','earner activation'],
      answer: `**Earner Account Activation** ⚙️\n\nAfter registration you must pay a **one-time activation fee of ₦1,000** before you can start earning.\n\n**Steps:**\n1️⃣ Go to your **Dashboard**\n2️⃣ Tap **"Activate Account"**\n3️⃣ Pay ₦1,000 via bank transfer\n4️⃣ Upload your **payment proof/receipt**\n5️⃣ ✅ Account activated **automatically** once confirmed\n\n> 💡 **One-time only** — you never pay this again after activation.` },

    // ── LINK SOCIAL HANDLES ────────────────────────────────────
    { keywords: ['social handle','link handle','add handle','link social','connect social','handle page','verification text','bio','add my handle','verify handle','username','platform handle','social media handle','social handles page'],
      answer: `**How to Link Your Social Media Handles** 🔗\n\nYou must link and get approved for **each platform separately** before doing tasks on it.\n\n**Steps:**\n1️⃣ Go to **Social Handles** page\n2️⃣ Tap **"Add Handle"**\n3️⃣ Select the **platform** (Instagram, TikTok, YouTube, Facebook, etc.)\n4️⃣ Enter your **username** for that platform\n5️⃣ Copy the **verification text** shown on screen\n6️⃣ Open that platform → paste the verification text in your **profile bio**\n7️⃣ Come back to Earncial → tap **"Submit for Verification"**\n8️⃣ ⏳ Wait for admin approval (1–6 hours)\n9️⃣ ✅ Once approved, you can now do tasks for that platform\n\n> ⚠️ **Important:** Each platform is a **separate submission**. If you want Instagram AND TikTok tasks, you must link both handles and get both approved.` },

    // ════════════════════════════════════════════════════════════
    //  EARNER — TASKS
    // ════════════════════════════════════════════════════════════

    // ── HOW TO EARN / PERFORM TASKS ────────────────────────────
    { keywords: ['how to earn','start earning','perform task','complete task','how to do task','start task','view task','find task','available task','browse task','how tasks work','earn money','earning','how does earncial work','getting started earner'],
      answer: `**How to Start Earning on Earncial** 💰\n\nHere's the **full flow from registration to earning:**\n\n**① Activate Your Account**\nPay ₦1,000 one-time activation fee → auto-activated after confirmation\n\n**② Link Your Social Handles**\nGo to **Social Handles** → Add handle → Select platform → Enter username → Copy verification text → Paste it in your profile bio on that platform → Submit → Wait for approval\n> ⚠️ Repeat this for every platform you want to earn from\n\n**③ Browse Available Tasks**\nGo to **Tasks** page → See all live tasks ready to perform\n\n**④ Perform a Task**\n• Tap **"View Task"** → read the instructions carefully\n• Tap **"Start Task"** → you'll be taken to the task link\n• Complete the action (follow, like, subscribe, join channel, etc.)\n• Come back to Earncial → tap **"Submit Proof"**\n• Upload a clear screenshot showing you completed it\n\n**⑤ Get Paid ✅**\nTask reviewed → approved → earnings credited to your balance (1–6 hours)\n\n> 💡 You can only perform tasks for platforms where your handle is **approved**.` },

    // ── SUBMIT PROOF ───────────────────────────────────────────
    { keywords: ['proof','screenshot','submit proof','task proof','how to submit','evidence','upload proof','submit my proof'],
      answer: `**How to Submit Task Proof** 📸\n\n1️⃣ Complete the task (follow, like, subscribe, join, etc.)\n2️⃣ Take a **clear screenshot** that shows:\n   • Your **username** is visible\n   • The **completed action** is clear (e.g. button shows "Following")\n3️⃣ Go back to Earncial → find the task\n4️⃣ Tap **"Submit Proof"**\n5️⃣ Upload the screenshot → tap **"Confirm"**\n6️⃣ ⏳ Admin reviews within **1–6 hours**\n\n✅ Approved → earnings auto-credited to your balance!` },

    // ── TASK REJECTED ──────────────────────────────────────────
    { keywords: ['rejected','task rejected','why rejected','not approved','submission rejected','disapproved','proof rejected','task not approved'],
      answer: `**Why Was My Task Rejected?** ❌\n\n**Most common reasons:**\n• Screenshot doesn't clearly show the completed action\n• Your username is not visible in the screenshot\n• You used a **different account** than your linked handle\n• Screenshot is blurry, cropped, or appears edited\n• You didn't follow the task instructions exactly\n• You undid the action after submitting (e.g. unfollowed)\n\n**How to fix and resubmit:**\n1. Re-read the task instructions carefully\n2. Redo the task using **the exact linked handle account**\n3. Take a fresh, clear screenshot\n4. Resubmit ✅\n\n> 💡 The username on your screenshot must match your linked handle exactly.` },

    // ════════════════════════════════════════════════════════════
    //  EARNER — WITHDRAW
    // ════════════════════════════════════════════════════════════

    // ── WITHDRAW ───────────────────────────────────────────────
    { keywords: ['withdraw','withdrawal','cash out','payout','receive money','get paid','send money','withdraw earnings','request withdrawal','how to withdraw'],
      answer: `**How to Withdraw Your Earnings** 💸\n\n**Complete step-by-step:**\n\n1️⃣ Go to the **Withdraw** page\n2️⃣ Select your **saved bank account**\n   *(Don't have one? Add it in Bank Settings first)*\n3️⃣ Enter the **amount** you want to withdraw\n4️⃣ Review the breakdown carefully:\n   • Amount entered\n   • Platform charge / fee\n   • **Final amount you will receive**\n5️⃣ Click **"Submit Withdrawal"**\n6️⃣ A **confirmation modal** appears — double-check your bank details & amount\n7️⃣ Click **"Confirm"** → processing begins\n8️⃣ ⏳ Wait a few seconds...\n9️⃣ 🧾 Your **withdrawal receipt** pops up — save it!\n🔟 Close receipt → page auto-scrolls to **Withdrawal History**\n1️⃣1️⃣ Tap **Refresh** → status updates to ✅ **Completed**\n1️⃣2️⃣ 🎉 **Check your bank — your money is there!**\n\n> 💡 You must add your bank account in **Bank Settings** before making a withdrawal.` },

    // ── BANK SETTINGS ──────────────────────────────────────────
    { keywords: ['bank account','bank setting','add bank','bank details','account number','save bank','my bank','bank name','add my bank'],
      answer: `**How to Add Your Bank Account** 🏦\n\n1️⃣ Go to **Profile → Bank Settings**\n2️⃣ Tap **"Add Bank Account"**\n3️⃣ Fill in:\n   • Bank name\n   • Account number\n   • Account holder name\n4️⃣ Tap **"Save"** ✅\n\nYour bank account will now appear as an option when you go to the **Withdraw** page.\n\n> ⚠️ The account name must match your registered Earncial name to avoid withdrawal delays.` },

    // ── WITHDRAWAL NOT RECEIVED ────────────────────────────────
    { keywords: ['not received','withdrawal pending','withdrawal failed','money not in bank','not credited','not in my account','withdrawal status','withdrawal not showing'],
      answer: `**Withdrawal Not Received?** 🤔\n\n**First — check your status:**\nGo to **Withdraw → Withdrawal History**\n\n• ⏳ **Processing** — still being handled, wait a bit longer\n• ✅ **Completed** — payment sent, check your bank\n• ❌ **Failed** — contact support immediately\n\n**Status is Completed but nothing in bank?**\n• Wait 30 more minutes — some banks have delays\n• Check with your bank for a pending incoming credit\n\n**Still nothing after 24 hours?**\nSubmit a support ticket with:\n• Your withdrawal receipt\n• Amount and date\n• Your bank account details` },

    // ── REFERRAL ───────────────────────────────────────────────
    { keywords: ['referral','refer','invite','commission','referral link','referred','bonus','invite friend','referral system'],
      answer: `**How the Referral System Works** 🤝\n\n1️⃣ Go to the **Referrals** page\n2️⃣ Copy your unique **referral link**\n3️⃣ Share it with friends (WhatsApp, social media, anywhere!)\n4️⃣ When they **sign up** using your link and complete tasks → you earn a **commission automatically** 💰\n5️⃣ Track your referrals and earnings on the Referrals page\n\n> 🔥 The more active referrals you have, the more passive income you earn — no extra work needed!` },

    // ════════════════════════════════════════════════════════════
    //  ADVERTISER — DEPOSIT
    // ════════════════════════════════════════════════════════════

    // ── DEPOSIT / FLUTTERWAVE ──────────────────────────────────
    { keywords: ['deposit','fund wallet','add money','top up','advertiser wallet','how to deposit','fund my wallet','flutterwave','payment provider','deposit funds','wallet balance','charge','200','their fee','payment fee','flutterwave fee'],
      answer: `**How to Deposit Funds — Advertiser** 💳\n\n**Steps:**\n1️⃣ Go to the **Deposit** page in your dashboard\n2️⃣ Enter the **amount** you want to add to your wallet\n3️⃣ Select your **payment method**\n4️⃣ Click **"Submit Deposit"**\n5️⃣ You'll be **redirected to Flutterwave** — our secure payment provider\n\n**⚠️ Important — About the Flutterwave Fee:**\nFlutterwave adds a small processing fee on top of your amount.\n\n**Example:**\nYou enter ₦10,000 on Earncial\nOn Flutterwave, you see ₦10,200\nThe extra ₦200 = **Flutterwave's fee** (NOT Earncial's fee)\nYou must pay **₦10,200** on Flutterwave\n→ Your Earncial wallet gets credited with your **₦10,000** automatically ✅\n\n> 💡 Always pay the **exact amount shown on Flutterwave** — your wallet is credited automatically right after payment!` },

    // ════════════════════════════════════════════════════════════
    //  ADVERTISER — POST TASK
    // ════════════════════════════════════════════════════════════

    // ── POST TASK ──────────────────────────────────────────────
    { keywords: ['post task','create task','how to post','new task','advertiser task','task description','set task','create a task','new task page','post a task','task url','task image','task sample','participations','how post task'],
      answer: `**How to Post a Task — Advertiser** 📢\n\n> 💡 Make sure your **wallet has enough balance** before posting. Need to deposit? Go to the Deposit page first.\n\n**Steps on the New Task page:**\n\n1️⃣ **Select Platform**\n   Instagram, Facebook, TikTok, YouTube, Twitter, Telegram, and more\n\n2️⃣ **Select Task Type**\n   Follow, Like, Comment, Subscribe, Join, Watch, and more\n\n3️⃣ **Price per task**\n   This is **automatically fixed** by the platform — no manual entry needed\n\n4️⃣ **Custom Description** *(optional but powerful)*\n   Add specific instructions for earners — e.g. "Comment 'Nice post' on this photo"\n\n5️⃣ **Number of Participants**\n   How many earners should complete this task — e.g. 100\n\n6️⃣ **Task Sample Image** *(optional)*\n   Upload a screenshot showing earners exactly where to go or what to do\n\n7️⃣ **Task URL** ⚠️ Very important!\n   Paste the exact link (your profile, post, video, channel)\n   Double-check it — make sure nothing is missing from the URL\n\n8️⃣ **Review the Calculations**\n   • Task price per participant\n   • Number of participants\n   • **Total deduction from your wallet**\n\n9️⃣ Click **"Submit Task"**\n\n⏳ Our team reviews the task — usually **within minutes**, but can take a few hours depending on the time\n\n✅ Once approved, earners start immediately!\n\n> 🗂️ You can manage all your tasks on the **Manage Tasks** page.` },

    // ════════════════════════════════════════════════════════════
    //  ADVERTISER — MANAGE TASKS
    // ════════════════════════════════════════════════════════════

    // ── MANAGE TASKS OVERVIEW ──────────────────────────────────
    { keywords: ['manage task','task','manage my tasks','all tasks','task status','see my tasks','view tasks','task list','tasks page'],
      answer: `**Manage Tasks — Overview** 🗂️\n\nGo to **Manage Tasks** to see all your tasks and their current status:\n\n• 🟡 **In Review** — waiting for admin approval\n• 🟢 **Active** — live, earners are completing it\n• ⏸️ **Paused** — temporarily stopped by you\n• ✅ **Completed** — all participants filled\n• ❌ **Rejected** — did not pass admin review\n\nFrom this page you can:\n➕ Increase participants\n⏸️ Pause / ▶️ Resume tasks\n🗑️ Delete tasks\n📊 View task details and stats\n\n> Go to **Analytics** for deeper performance insights.` },

    // ── INCREASE PARTICIPANTS ──────────────────────────────────
    { keywords: ['increase participants','add more participants','increase task','more participants','add participants','plus button','increase after','task live','increase participation','add participation'],
      answer: `**Can I Increase Participants After My Task Goes Live?** ✅ Yes!\n\n**How to do it:**\n\n**Option 1 — From the task list:**\nGo to **Manage Tasks** → find your task → tap the **➕ (plus) button icon**\n\n**Option 2 — From task details:**\nGo to **Manage Tasks** → tap **"View Task Details"** → tap **"Increase Participants"**\n\nBoth do the same thing! 😊\n\n**What happens next:**\n1️⃣ Enter the number of extra participants you want to add\n   *(minimum 10)*\n2️⃣ See the **cost calculation** automatically\n3️⃣ Confirm → participants are added **instantly**\n4️⃣ The cost is **immediately deducted** from your wallet\n\n> 🎉 **Good news:** No need to wait for approval again! Your task stays live and earners can start right away.` },

    // ── PAUSE / RESUME TASK ────────────────────────────────────
    { keywords: ['pause task','resume task','stop task','pause my task','can i stop','stop my task','pause and resume','task paused','unpause'],
      answer: `**Can I Pause My Task?** ✅ Yes!\n\n**To Pause:**\nGo to **Manage Tasks** → find your task → tap the **⏸️ Pause button icon**\n→ Task is **immediately paused** — earners can no longer see or do it\n\n**To Resume:**\nGo to **Manage Tasks** → find the paused task → tap the **▶️ Resume button icon**\n→ Task goes **immediately live** again — everything continues automatically\n\n> 💡 Pausing is useful when you want to review incoming submissions, make changes, or temporarily stop the task without losing your budget.` },

    // ── DELETE TASK / REFUND ───────────────────────────────────
    { keywords: ['delete task','cancel task','remove task','can i delete','delete my task','task refund','remaining budget','95%','95 percent','refund task','cancel and refund','budget back'],
      answer: `**Can I Delete My Task?** ✅ Yes!\n\n**How:**\nGo to **Manage Tasks** → find your task → tap the **🗑️ Delete / Cancel button**\n→ Task is permanently stopped\n\n**What happens to my remaining budget?**\n\n✅ You get back **95%** of your **remaining unused budget**\n\n**Example:**\nYour total budget = ₦10,000\nEarners already spent = ₦5,000\nYour remaining budget = ₦5,000\n\n**Refund calculation:**\n95% of ₦5,000 = **₦4,750 back to your wallet**\n\n> ⚠️ Why not 100%? The 5% covers **platform processing charges** that were already deducted when the task was created. This is why 100% cannot be returned.` },

    // ── ANALYTICS ─────────────────────────────────────────────
    { keywords: ['analytics','analysis','analyse','analyze','task performance','campaign stats','task stats','view analytics','performance','insights','report'],
      answer: `**Task Analytics — Advertiser** 📊\n\nYes! You can analyse your task performance on the **Analytics** page.\n\n**What you can see:**\n📈 Task completion rates over time\n💰 Spending breakdown per task and platform\n👥 Participant progress\n📅 Weekly / Monthly / Yearly views\n🏆 Best performing tasks\n\n**How to access:**\nGo to **Analytics** in your advertiser dashboard\n\n> 💡 Use analytics to understand which platforms and task types give you the best results, and optimise your budget accordingly.` },

    // ── TASK REJECTED (ADVERTISER) ─────────────────────────────
    { keywords: ['task rejected advertiser','my task was rejected','why task rejected','task not approved','task disapproved','post rejected'],
      answer: `**Why Was My Task Rejected?** ❌\n\n**Common reasons:**\n• Task URL is invalid, broken, or incomplete\n• Task description is unclear or misleading\n• The platform/task type combination is not supported\n• Reward per participant set too low\n• Duplicate task already running\n\n**How to fix:**\n1. Go to **Manage Tasks** → find the rejected task → check the rejection reason shown\n2. Fix the issue (update URL, description, reward, etc.)\n3. Resubmit the task\n\n> 💡 Always double-check your **Task URL** — make sure the full link is correct and nothing is cut off.` },

  ]; // end KB

  /* ── FALLBACK ─────────────────────────────────────────────── */
  var FALLBACK = `Hmm, I'm not sure about that specific question. 🤔\n\n**Here's what Earni knows:**\n\n👤 **Earner:** activation, social handles, tasks, proof, withdraw, referrals\n📢 **Advertiser:** deposit (Flutterwave), post task, manage tasks, increase participants, pause/resume/delete, analytics\n🐛 **Technical:** bugs, login issues\n\nOr email us 📧 **support@earncial.com** — we reply within 24 hours! 🙋`;

  /* ── FIND BEST ANSWER ─────────────────────────────────────── */
  function getAnswer(msg) {
    var lower = msg.toLowerCase();
    var best = null, bestScore = 0;
    KB.forEach(function(e) {
      var score = 0;
      e.keywords.forEach(function(kw) { if (lower.includes(kw)) score += kw.split(' ').length * 2; });
      if (score > bestScore) { bestScore = score; best = e; }
    });
    return best ? best.answer : FALLBACK;
  }

  /* ── MARKDOWN-LITE PARSER ─────────────────────────────────── */
  function md(text) {
    return text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') // escape first
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      .replace(/support@earncial\.com/g,'<a href="mailto:support@earncial.com" style="color:var(--primary,#00aaff);font-weight:600;">support@earncial.com</a>')
      .replace(/\n\|---\|---\|\n/g,'</tr></thead><tbody><tr>')  // table separator
      .replace(/\|(.*?)\|(.*?)\|/g, function(m,a,b){ return '<tr><td>'+a.trim()+'</td><td>'+b.trim()+'</td></tr>'; })
      .replace(/\n\n/g,'</p><p style="margin:0 0 8px;">')
      .replace(/\n/g,'<br>')
      .replace(/^/,'<p style="margin:0 0 8px;">')
      .replace(/$/, '</p>')
      .replace(/<p style="margin:0 0 8px;"><\/p>/g,'');
  }

  /* ── BUILD HTML ───────────────────────────────────────────── */
  var root = document.getElementById('earncial-chat-root');
  if (!root) return;

  root.innerHTML =
    // FAB
    '<button class="ec-fab" id="ecFab" onclick="ecToggle()" aria-label="Chat with Earni AI">' +
      '<div class="ec-fab-pulse"></div>' +
      '<i class="fas fa-robot" id="ecFabIcon"></i>' +
      '<span class="ec-fab-badge" id="ecBadge">1</span>' +
    '</button>' +
    '<span class="ec-fab-lbl" id="ecFabLbl">AI Help</span>' +

    // OVERLAY
    '<div class="ec-overlay" id="ecOverlay">' +
      '<div class="ec-panel" id="ecPanel">' +

        // Header
        '<div class="ec-hd">' +
          '<div class="ec-hd-l">' +
            '<div class="ec-hd-av"><i class="fas fa-robot"></i></div>' +
            '<div>' +
              '<div class="ec-hd-name">Earni <span class="ec-ai-tag">AI</span></div>' +
              '<div class="ec-hd-sub"><span class="ec-dot-on"></span>Always available</div>' +
            '</div>' +
          '</div>' +
          '<div class="ec-hd-r">' +
            '<button class="ec-hd-btn" onclick="ecClear()" title="Clear chat"><i class="fas fa-rotate-left"></i></button>' +
            '<button class="ec-hd-btn" onclick="ecToggle()" title="Close"><i class="fas fa-times"></i></button>' +
          '</div>' +
        '</div>' +

        // Messages
        '<div class="ec-msgs" id="ecMsgs"></div>' +

        // Chips
        '<div class="ec-chips" id="ecChips">' +
          '<button class="ec-chip" onclick="ecQ(\'How do I activate my account?\')">⚙️ Activate</button>' +
          '<button class="ec-chip" onclick="ecQ(\'How do I link my social handle?\')">🔗 Link handle</button>' +
          '<button class="ec-chip" onclick="ecQ(\'How do I complete tasks and start earning?\')">💰 Start earning</button>' +
          '<button class="ec-chip" onclick="ecQ(\'How do I withdraw my earnings?\')">💸 Withdraw</button>' +
          '<button class="ec-chip" onclick="ecQ(\'How do I deposit funds via Flutterwave?\')">💳 Deposit</button>' +
          '<button class="ec-chip" onclick="ecQ(\'How do I post a task?\')">📢 Post task</button>' +
          '<button class="ec-chip" onclick="ecQ(\'Can I increase participants after task goes live?\')">➕ Increase participants</button>' +
          '<button class="ec-chip" onclick="ecQ(\'Can I pause my task?\')">⏸️ Pause task</button>' +
          '<button class="ec-chip" onclick="ecQ(\'Can I delete my task?\')">🗑️ Delete task</button>' +
          '<button class="ec-chip" onclick="ecQ(\'Why was my task rejected?\')">❌ Task rejected</button>' +
          '<button class="ec-chip" onclick="ecQ(\'Contact human support\')">🙋 Human support</button>' +
        '</div>' +

        // Input
        '<div class="ec-bar">' +
          '<input class="ec-inp" id="ecInp" type="text" placeholder="Ask me anything about Earncial..." autocomplete="off" onkeydown="if(event.key===\'Enter\')ecSend()">' +
          '<button class="ec-send" id="ecSend" onclick="ecSend()"><i class="fas fa-paper-plane"></i></button>' +
        '</div>' +

      '</div>' +
    '</div>';

  /* ── STATE ───────────────────────────────────────────────── */
  var isOpen = false, msgCount = 0, isTyping = false;

  /* ── TOGGLE ──────────────────────────────────────────────── */
  window.ecToggle = function() {
    isOpen = !isOpen;
    document.getElementById('ecOverlay').classList.toggle('ec-open', isOpen);
    document.getElementById('ecFabIcon').className = isOpen ? 'fas fa-times' : 'fas fa-robot';
    document.body.style.overflow = isOpen ? 'hidden' : '';
    var badge = document.getElementById('ecBadge');
    if (badge) badge.style.display = 'none';
    if (isOpen && msgCount === 0) ecGreet();
    if (isOpen) setTimeout(function(){ document.getElementById('ecInp').focus(); }, 400);
  };
  window.openChat = function() { if (!isOpen) ecToggle(); };

  /* ── GREET ───────────────────────────────────────────────── */
  function ecGreet() {
    addMsg('bot', "Hey there! 👋 I'm **Earni**, your Earncial AI assistant.\n\nI can help with activation, social handles, tasks, withdrawals, deposits and more.\n\nWhat do you need help with today? You can type or tap a quick option below 👇");
  }

  /* ── ADD MESSAGE ─────────────────────────────────────────── */
  function addMsg(role, text, typing) {
    var msgs = document.getElementById('ecMsgs');
    var row  = document.createElement('div');
    row.className = 'ec-row ec-row-' + role;

    if (role === 'bot') {
      var av = document.createElement('div');
      av.className = 'ec-av';
      av.innerHTML = '<i class="fas fa-robot"></i>';
      row.appendChild(av);
    }

    var bub = document.createElement('div');
    bub.className = 'ec-bub ec-bub-' + role;

    if (typing) {
      bub.className += ' ec-bub-typing';
      bub.innerHTML = '<span class="ec-td"></span><span class="ec-td"></span><span class="ec-td"></span>';
    } else {
      bub.innerHTML = md(text);
      msgCount++;
      if (role === 'user') {
        var chips = document.getElementById('ecChips');
        if (chips) chips.style.display = 'none';
      }
    }

    row.appendChild(bub);
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
    return row;
  }

  /* ── SEND ────────────────────────────────────────────────── */
  window.ecSend = function() {
    if (isTyping) return;
    var inp = document.getElementById('ecInp');
    var msg = inp.value.trim();
    if (!msg) return;
    inp.value = '';

    addMsg('user', msg);
    isTyping = true;

    var typEl = addMsg('bot', '', true);
    var delay = 600 + Math.min(msg.length * 6, 900);

    setTimeout(function() {
      if (typEl.parentNode) typEl.parentNode.removeChild(typEl);
      addMsg('bot', getAnswer(msg));
      isTyping = false;
    }, delay);
  };

  window.ecQ = function(q) { document.getElementById('ecInp').value = q; ecSend(); };
  window.ecClear = function() {
    document.getElementById('ecMsgs').innerHTML = '';
    msgCount = 0; isTyping = false;
    var chips = document.getElementById('ecChips');
    if (chips) chips.style.display = 'flex';
    ecGreet();
  };

  // Close on backdrop click
  document.getElementById('ecOverlay').addEventListener('click', function(e) {
    if (e.target === this) ecToggle();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) ecToggle();
  });

})();
