package server

// Content of the /demo tour: acts -> steps. Every visible string is a bilingual pair (demoBi) so the page
// works without JavaScript and the zh/en toggle is a pure CSS switch. Screenshots are NOT listed here:
// they come from static/demo/manifest.json (written by scripts/capture_demo_assets.py), which maps each
// image to an (act, step) pair, so the page and the capture script share one source of truth.

// demoBi is one string in both languages. Both halves must be non-empty (pinned by tests).
type demoBi struct{ ZH, EN string }

// demoStat is one number on the "automated checks" strip. The values are the counts recorded in
// regress/.state/stamp.json by the last green predeploy run (2026-10-09, tree 07ee556f5bea79b7); the
// demo regression suite refuses a page that claims MORE than the stamp does.
type demoStat struct {
	Key   string // stable id used by tests
	Value string
	Label demoBi
}

var demoStats = []demoStat{
	{"go", "1082", demoBi{"Go 单元测试", "Go unit tests"}},
	{"integration", "982", demoBi{"集成检查(真实二进制)", "integration checks (real binary)"}},
	{"browser", "136", demoBi{"浏览器检查(全角色 UI)", "browser checks (every role's UI)"}},
	{"realmodel", "81/81", demoBi{"真实模型全流程旅程", "real-model journey checks"}},
}

type demoAdvantage struct {
	ID    string // step-0-N
	Icon  string
	Title demoBi
	Body  demoBi
}

var demoAdvantages = []demoAdvantage{
	{"0-1", "四", demoBi{"四诊合参完整闭环", "The complete four-examination loop"},
		demoBi{"望(舌象、面诊图像 AI 分析)、闻(声音与呼吸)、问(AI 流式追问)、切(脉率脉象 + IoT 设备数据)汇成一份可读的辨证报告 —— 不是聊天机器人,是完整的中医诊断流程。",
			"Inspection (AI tongue/face imaging), listening (voice and breathing), inquiry (streamed AI questions) and palpation (pulse + IoT data) merge into one readable pattern-differentiation report. Not a chatbot: a complete TCM diagnostic workflow."}},
	{"0-2", "医", demoBi{"患者—医生协同闭环", "A patient-and-doctor loop"},
		demoBi{"AI 先做初筛与摘要,医生在收件箱按 普通 / 关注 / 紧急 分诊、回复并开具治疗方案,患者看到反馈后可继续追问。AI 提效,医生把关。",
			"The AI pre-screens and summarises; the doctor triages (normal / watch / critical), replies and writes a treatment plan; the patient sees the feedback and answers back. AI saves time, the doctor stays in charge."}},
	{"0-3", "盾", demoBi{"多角色安全隔离,有数字为证", "Role isolation, backed by numbers"},
		demoBi{"访客、患者、医生、管理员、开发者各看各的:角色围栏、限流、输入校验、越权拒绝。1082 项 Go 单元测试 · 982 项集成检查 · 136 项浏览器检查 · 真实模型旅程 81/81 —— 每次部署前必须全绿。",
			"Guests, patients, doctors, admins and developers each see only their own slice: role fences, rate limiting, input validation, refusals on privilege escalation. 1082 Go unit tests, 982 integration checks, 136 browser checks, real-model journey 81/81 — all green before every deploy."}},
	{"0-4", "擎", demoBi{"可切换 AI 后端", "A swappable AI backend"},
		demoBi{"同一套应用既可接 Gemini,也可通过 sihat-listener 调用本机 Claude opus / sonnet / haiku。按场景在质量、速度与成本之间切换,业务代码不用改;上游故障时优雅降级。",
			"The same app talks to Gemini, or — through sihat-listener — to local Claude opus / sonnet / haiku. Trade quality, speed and cost per scenario without touching business code; upstream failures degrade gracefully."}},
	{"0-5", "语", demoBi{"中 / 英 / 马来三语,移动优先", "Chinese / English / Malay, mobile-first"},
		demoBi{"界面与 AI 回答支持中文、English、Bahasa Melayu 一键切换;手机上无横向滚动、按钮在拇指范围内,适合门店、诊所与家庭使用。",
			"The UI and the AI's answers switch between 中文, English and Bahasa Melayu in one tap; on a phone there is no sideways scrolling and the controls sit in thumb reach — made for clinics, shops and homes."}},
}

type demoStep struct {
	ID       string // "N-M" -> DOM id step-N-M
	Role     string // guest | patient | doctor | admin | developer | system
	Title    demoBi
	See      demoBi // what you see
	Why      demoBi // why it matters (one line)
	Href     string // deep link into the real app
	Verified []string
	Shots    []demoShot // filled from the manifest at render time
}

type demoAct struct {
	N     int
	Role  string
	Icon  string
	Title demoBi
	Intro demoBi
	Steps []demoStep
}

// demoActs is the guided tour, acts 1-7 (act 0 = hero, act 8 = summary are rendered by the template).
var demoActs = []demoAct{
	{N: 1, Role: "guest", Icon: "访", Title: demoBi{"访客:无需注册的四诊合参问诊", "Guest: a four-examination consultation with no sign-up"},
		Intro: demoBi{"任何人打开网址就能完成一次完整问诊:基本信息 → AI 问诊 → 舌象 / 面诊拍照 → 声音 / 脉象 / IoT → AI 报告。",
			"Anyone can finish a complete consultation straight from the URL: basic info, AI inquiry, tongue and face photos, voice / pulse / IoT, then an AI report."},
		Steps: []demoStep{
			{ID: "1-1", Role: "guest", Title: demoBi{"首页:一键开始", "Landing page: one tap to start"},
				See:  demoBi{"中医风格首页,四诊说明与「开始免费评估」按钮;右上角可切换中文 / English / Bahasa。", "A TCM-styled landing page explaining the four examinations with a start button; the corner toggle switches Chinese / English / Malay."},
				Why:  demoBi{"零门槛入口,访客不需要账号就能体验完整价值。", "A zero-friction entry: guests get the full value without an account."},
				Href: "/", Verified: []string{"ACI pages", "i18n_browser_test.py", "e2e_browser_test.py"}},
			{ID: "1-2", Role: "guest", Title: demoBi{"第一步:基本信息与主诉", "Step 1: basic information and complaints"},
				See:  demoBi{"姓名、年龄、性别、身高体重,以及头痛、疲劳等症状标签,可自定义添加。", "Name, age, gender, height and weight, plus symptom chips such as headache and fatigue — custom symptoms can be added."},
				Why:  demoBi{"结构化主诉为后面的 AI 追问与辨证提供上下文。", "Structured complaints give the AI follow-ups and the final differentiation their context."},
				Href: "/", Verified: []string{"e2e_browser_test.py", "ui_roles_browser_test.py"}},
			{ID: "1-3", Role: "guest", Title: demoBi{"问诊:AI 中医助手流式追问", "Inquiry: the AI assistant asks, streamed live"},
				See:  demoBi{"AI 像中医师一样逐步追问起病时间、睡眠、寒热、二便,回答实时流式出现,并给出可点选的快捷回复。", "The AI asks like a TCM practitioner — onset, sleep, hot/cold, digestion — with streamed answers and tap-to-reply chips."},
				Why:  demoBi{"问诊质量决定报告质量;流式输出让等待可感知,不会白屏。", "Inquiry quality drives report quality; streaming keeps the wait visible instead of a blank screen."},
				Href: "/", Verified: []string{"ACI chat", "ACI datacontract", "journey"}},
			{ID: "1-4", Role: "guest", Title: demoBi{"望诊:舌象与面诊图片的 AI 分析", "Inspection: AI analysis of tongue and face photos"},
				See:  demoBi{"上传一张舌头照片,AI 返回舌质、舌苔、齿痕等观察与置信度;面部气色同理。", "Upload a tongue photo and the AI returns body colour, coating, teeth marks and a confidence; the face works the same way."},
				Why:  demoBi{"把最依赖经验的「望」变成可记录、可复核的结构化观察。", "The most experience-dependent examination becomes a recorded, reviewable observation."},
				Href: "/", Verified: []string{"ACI image", "e2e_browser_test.py (real upload)"}},
			{ID: "1-5", Role: "guest", Title: demoBi{"闻诊与切诊:声音、脉象与 IoT 数据", "Listening and palpation: voice, pulse and IoT data"},
				See:  demoBi{"录音分析声音与呼吸;输入或接入设备的心率(BPM),勾选浮、沉、弦、滑等脉象;最后一屏汇总四诊信息供复核。", "Record voice and breathing; enter or sync a device heart rate and tick pulse qualities (floating, deep, wiry, slippery...); a final screen reviews all four examinations."},
				Why:  demoBi{"四诊信息齐全才能合参;可跳过的步骤保证体验不被打断。", "All four examinations are needed to combine them; optional steps never block the flow."},
				Href: "/", Verified: []string{"ACI image", "ACI datacontract", "e2e_browser_test.py"}},
			{ID: "1-6", Role: "guest", Title: demoBi{"AI 辨证报告", "The AI pattern-differentiation report"},
				See:  demoBi{"体质类型、证型与受累脏腑、五行图、食疗宜忌、生活与穴位建议、随访提示,可打印或存为 PDF;手机上同样完整。", "Constitution, pattern and affected organs, five-elements chart, dietary do's and don'ts, lifestyle and acupoint advice, follow-up tips; printable as PDF and complete on a phone."},
				Why:  demoBi{"从「一堆症状」到「可执行的调理方案」,并带免责声明。", "From a pile of symptoms to an actionable plan — with a medical disclaimer."},
				Href: "/", Verified: []string{"ACI consult", "journey --ai=pc (real models)", "report_page_browser_test.py"}},
		}},
	{N: 2, Role: "patient", Icon: "患", Title: demoBi{"注册患者:报告永久保存、持续跟进", "Registered patient: reports are kept and followed up"},
		Intro: demoBi{"访客报告一键存入新账号;之后可再次问诊、围绕报告追问、咨询饮食、查看健康概览与个人档案。",
			"The guest report moves into a new account; the patient can consult again, chat about the report, ask about diet and see an overview and profile."},
		Steps: []demoStep{
			{ID: "2-1", Role: "patient", Title: demoBi{"注册与登录(含一键体验入口)", "Register and log in (with one-click access)"},
				See:  demoBi{"保存报告时跳转注册页;登录页提供患者 / 医生 / 管理 / 开发四个一键体验按钮,手机端同样适配。", "Saving the report leads to sign-up; the login page offers four one-click role buttons, also on mobile."},
				Why:  demoBi{"注册不丢数据,演示和试用都不需要记账号。", "Registration loses nothing, and demos or trials never need remembered credentials."},
				Href: "/login", Verified: []string{"ACI auth", "ui_roles_browser_test.py", "flow_browser_test.py"}},
			{ID: "2-2", Role: "patient", Title: demoBi{"访客报告自动迁移 · 患者中心", "Guest report migrates automatically · patient hub"},
				See:  demoBi{"注册完成后,刚才的访客报告已出现在历史列表;顶部是评估次数、体质、证型等概览。", "Right after registering, the guest report is already in the history list, under an overview of assessments, constitution and top pattern."},
				Why:  demoBi{"体验到价值之后才要求注册,转化与留存都更自然。", "Sign-up is asked for only after value is delivered, which is better for both conversion and retention."},
				Href: "/patient", Verified: []string{"ACI datacontract", "journey", "flow_browser_test.py"}},
			{ID: "2-3", Role: "patient", Title: demoBi{"第二次问诊:体质变化可对比", "A second consultation: compare over time"},
				See:  demoBi{"已登录时再做一次评估,直接保存到账号;历史列表按时间排列,每份报告可展开、可打开独立页面。", "While signed in, a second assessment saves straight to the account; the history lists them by date and each opens as its own page."},
				Why:  demoBi{"中医讲「治未病」,长期记录比一次诊断更有价值。", "TCM values prevention; a long record is worth more than a single diagnosis."},
				Href: "/", Verified: []string{"journey (registered consult)", "ACI consult"}},
			{ID: "2-4", Role: "patient", Title: demoBi{"报告追问:围绕自己的报告继续问", "Report chat: keep asking about your own report"},
				See:  demoBi{"患者就报告里的某条建议继续提问,AI 结合该报告内容作答。(此功能为 API 能力,截图为本次录制的真实调用返回。)", "The patient asks about a specific recommendation and the AI answers using that very report. (An API capability; the image is the live response from this recording.)"},
				Why:  demoBi{"报告不再是一次性文档,而是可对话的健康档案。", "The report stops being a one-off document and becomes a conversational health record."},
				Href: "/patient", Verified: []string{"journey (report-chat)", "ACI datacontract", "Go unit tests"}},
			{ID: "2-5", Role: "patient", Title: demoBi{"饮食宜忌咨询", "Dietary advice"},
				See:  demoBi{"输入「可以吃冰镇水果吗?咖啡呢?」,AI 结合体质给出个性化回答;限流或上游故障时给出友好提示。", "Ask “can I eat iced fruit? what about coffee?” and the AI answers for the constitution; rate limits or upstream failures produce friendly messages."},
				Why:  demoBi{"每天都会用到的高频问题,最能体现个性化价值。", "The question people ask every day, and the clearest place to show personalisation."},
				Href: "/patient#dietary-q", Verified: []string{"Go unit tests (dietary)", "ACI datacontract"}},
			{ID: "2-6", Role: "patient", Title: demoBi{"健康总览:子午流注器官时钟与个人档案", "Overview: the organ clock and the profile"},
				See:  demoBi{"根据当前时辰显示当令脏腑与养生提示;档案页保存年龄、身高体重(自动算 BMI)与病史。", "The organ clock shows which organ is active now with a wellness tip; the profile keeps age, height, weight (BMI auto-computed) and history."},
				Why:  demoBi{"每天打开都有新内容,提高复访。", "Fresh content every day brings patients back."},
				Href: "/patient#health-overview", Verified: []string{"features_browser_test.py (profile)", "ui_roles_browser_test.py"}},
		}},
	{N: 3, Role: "patient", Icon: "连", Title: demoBi{"连接医生:把 AI 报告交给真人把关", "Connect a doctor: a human reviews the AI report"},
		Intro: demoBi{"患者在医生目录里挑选医生,一键提交问诊申请,随时查看状态。", "The patient picks a doctor from the directory, sends a request in one tap and can check its status any time."},
		Steps: []demoStep{
			{ID: "3-1", Role: "patient", Title: demoBi{"医生目录", "Doctor directory"},
				See:  demoBi{"已注册的医生以卡片展示:姓名、专长、简介、从业年限。", "Registered doctors appear as cards: name, specialty, bio and years of practice."},
				Why:  demoBi{"信任来自透明:患者能看到医生是谁、擅长什么。", "Trust comes from transparency: patients see who the doctor is and what they are good at."},
				Href: "/patient#doctor-directory", Verified: []string{"ACI roles", "flow_browser_test.py", "ui_roles_browser_test.py"}},
			{ID: "3-2", Role: "patient", Title: demoBi{"向医生提交问诊申请", "Send a consultation request"},
				See:  demoBi{"选定医生后一键提交,系统把当前报告与患者资料一并发给医生,并立即给出确认提示。", "Pick a doctor and send; the report and patient details travel with the request, with an instant confirmation."},
				Why:  demoBi{"医生拿到的是完整上下文,不用再从头问一遍。", "The doctor receives full context and does not have to ask everything again."},
				Href: "/patient#doctor-directory", Verified: []string{"ACI datacontract", "journey (doctor connect)", "flow_browser_test.py"}},
			{ID: "3-3", Role: "patient", Title: demoBi{"申请状态", "Request status"},
				See:  demoBi{"「我的咨询」列表显示 待处理 ⏳ / 已回复 ✓,列表自动刷新,无需手动刷新页面;也可取消申请。", "“My consultations” shows Pending ⏳ or Reviewed ✓, refreshes by itself, and lets the patient cancel."},
				Why:  demoBi{"患者永远知道事情进展到哪一步。", "The patient always knows where things stand."},
				Href: "/patient#consultations-list", Verified: []string{"features_browser_test.py (cancel)", "ACI roles"}},
		}},
	{N: 4, Role: "doctor", Icon: "医", Title: demoBi{"医生端:分诊、回复、治疗方案", "Doctor workspace: triage, reply, treatment plan"},
		Intro: demoBi{"医生注册后进入专属工作台,在 AI 摘要的帮助下快速处理患者请求,并让患者看到反馈。", "A registered doctor lands in a dedicated workspace and, helped by AI summaries, clears patient requests fast — and the patient sees the answer."},
		Steps: []demoStep{
			{ID: "4-1", Role: "doctor", Title: demoBi{"医生注册", "Doctor registration"},
				See:  demoBi{"注册时选择「医生」身份,填写专长、简介和年资;完成后直接进入医生工作台。", "Choose the Doctor role at sign-up, add specialty, bio and years of experience, and land in the doctor workspace."},
				Why:  demoBi{"医生自助入驻,平台无需人工开户。", "Doctors onboard themselves; no manual account set-up."},
				Href: "/login#signup", Verified: []string{"ACI auth", "flow_browser_test.py", "ui_roles_browser_test.py"}},
			{ID: "4-2", Role: "doctor", Title: demoBi{"收件箱:患者报告一目了然", "Inbox: every patient report at a glance"},
				See:  demoBi{"每条请求显示患者、证型、体质、请求时间与 AI 摘要;支持搜索、状态与优先级筛选,另有「患者」标签页汇总。", "Each request shows the patient, pattern, constitution, time and an AI summary, with search, status and priority filters and a Patients tab."},
				Why:  demoBi{"医生的时间最贵,摘要让 30 秒内完成初判。", "A doctor's time is the scarcest resource; the summary makes a first read a 30-second job."},
				Href: "/doctor", Verified: []string{"ACI roles", "ui_roles_browser_test.py"}},
			{ID: "4-3", Role: "doctor", Title: demoBi{"分诊标记:普通 / 关注 / 紧急", "Triage flags: normal / watch / critical"},
				See:  demoBi{"一键把请求标为 关注 🟡 或 紧急 🔴,卡片边框与徽章随之变色,并可按优先级筛选。", "Flag a request Watch 🟡 or Critical 🔴; the card border and badge change colour and the list can be filtered by priority."},
				Why:  demoBi{"危险信号不会淹没在普通请求里。", "Warning signs never drown among routine requests."},
				Href: "/doctor", Verified: []string{"ACI datacontract (flag)", "journey (doctor flag)"}},
			{ID: "4-4", Role: "doctor", Title: demoBi{"回复患者并开具治疗方案", "Reply and write a treatment plan"},
				See:  demoBi{"写下临床反馈并发送;展开「治疗方案」填写证型、方药、生活建议与复诊日期并保存。", "Write clinical feedback and send it; open Treatment Plan to record pattern, formula, lifestyle advice and follow-up date."},
				Why:  demoBi{"医生的专业判断是产品的最终输出,而不是 AI 的一句话。", "The doctor's professional judgement, not a one-liner from the AI, is the product's final output."},
				Href: "/doctor", Verified: []string{"journey (reply + treatment plan)", "flow_browser_test.py", "ui_roles_browser_test.py"}},
			{ID: "4-5", Role: "doctor", Title: demoBi{"AI 患者摘要与 AI 生成问诊题", "AI patient summary and AI-generated inquiry questions"},
				See:  demoBi{"一键让 AI 汇总某位患者的历史报告(API 调用,截图为真实返回);也可按年龄、性别、主诉生成一套定制问诊题。", "Ask the AI to summarise a patient's history (an API call; the image is the live answer), or generate a tailored question set from age, gender and complaint."},
				Why:  demoBi{"AI 负责整理与提问,判断留给医生。", "The AI organises and asks; the judgement stays with the doctor."},
				Href: "/doctor", Verified: []string{"ACI datacontract (patient-summary)", "Go unit tests (summaries)", "journey"}},
			{ID: "4-6", Role: "patient", Title: demoBi{"患者看到反馈并继续回复", "The patient sees the feedback and replies"},
				See:  demoBi{"患者的「我的咨询」先变为「已回复 ✓」并出现医生留言与治疗方案卡片;患者可直接回复医生,请求随即回到「待处理」等待医生再次答复,形成对话。", "The patient's list flips to Reviewed ✓ with the doctor's message and treatment-plan card; the patient can answer the doctor, which puts the request back to Pending until the doctor replies again — a conversation."},
				Why:  demoBi{"闭环完成:AI 初筛 → 医生把关 → 患者执行 → 持续沟通。", "The loop closes: AI screening, doctor review, patient action, ongoing dialogue."},
				Href: "/patient#consultations-list", Verified: []string{"journey (patient sees + replies)", "ui_roles_browser_test.py"}},
		}},
	{N: 5, Role: "admin", Icon: "管", Title: demoBi{"管理员:系统心跳一眼看清", "Admin: the system's pulse at a glance"},
		Intro: demoBi{"只读的运营控制台,把健康、数据库、提示词覆盖率与用户统计集中在一页。", "A read-only operations console that puts health, database, prompt coverage and user statistics on one page."},
		Steps: []demoStep{
			{ID: "5-1", Role: "admin", Title: demoBi{"系统健康、数据库状态与用户统计", "System health, database status and user stats"},
				See:  demoBi{"服务状态、数据库连通、AI 服务、运行时长与环境;用户总数、管理员数与诊断次数。", "Service status, database connectivity, AI service, uptime and environment; total users, admins and diagnoses."},
				Why:  demoBi{"出问题时先看这一页就知道是哪一层。", "When something breaks, this page says which layer."},
				Href: "/admin", Verified: []string{"admin_browser_test.py", "ui_roles_browser_test.py", "ACI roles"}},
			{ID: "5-2", Role: "admin", Title: demoBi{"提示词覆盖率与错误概览", "Prompt coverage and error overview"},
				See:  demoBi{"列出每个 AI 功能使用的提示词及是否被自定义,并汇总近期错误。", "Lists the prompt behind each AI feature (and whether it is customised), plus a summary of recent errors."},
				Why:  demoBi{"提示词是产品质量的核心资产,必须可见、可管。", "Prompts are the core quality asset; they must be visible and manageable."},
				Href: "/admin", Verified: []string{"ui_roles_browser_test.py (prompt table)", "ACI datacontract"}},
			{ID: "5-3", Role: "admin", Title: demoBi{"系统设置(密钥脱敏)与 API Key 测试", "Settings (masked keys) and API-key test"},
				See:  demoBi{"设置页只显示脱敏后的密钥(仅保留末 6 位);页面另有「测试 Gemini Key」按钮,验证凭证是否有效并给出明确结果。截图中的密钥为演示占位值。", "The settings view shows masked keys only (last 6 characters); a “Test Gemini Key” button checks the credential and reports a clear result. Keys in the screenshot are demo placeholders."},
				Why:  demoBi{"运维不会因为看页面而泄露密钥。", "Operators can look without ever leaking a key."},
				Href: "/admin", Verified: []string{"ACI security (settings)", "ui_roles_browser_test.py (key test)"}},
		}},
	{N: 6, Role: "developer", Icon: "发", Title: demoBi{"开发者:可观测性与开发者助手", "Developer: observability and an assistant"},
		Intro: demoBi{"日志、运行指标与开发者助手,让排障和新人上手都更快。", "Logs, runtime metrics and a developer assistant make troubleshooting and onboarding faster."},
		Steps: []demoStep{
			{ID: "6-1", Role: "developer", Title: demoBi{"日志与错误追踪", "Logs and error tracking"},
				See:  demoBi{"开发者账号进入同一控制台,查看近期日志与错误聚合。", "A developer account opens the same console and sees recent logs and aggregated errors."},
				Why:  demoBi{"问题在用户反馈之前就已被看见。", "Problems are seen before users report them."},
				Href: "/admin", Verified: []string{"journey (developer.logs)", "ui_roles_browser_test.py (developer)"}},
			{ID: "6-2", Role: "developer", Title: demoBi{"运行状态与监控指标", "Runtime status and monitoring"},
				See:  demoBi{"运行时长、Go 版本与 24 小时错误统计;客户端上报的性能指标与日志也汇总在此(本次为全新测试栈,尚无上报)。只对开发者 / 管理员开放,匿名与患者一律拒绝。(API 能力,截图为真实返回。)", "Uptime, Go version and 24-hour error statistics; client-reported performance metrics and logs are collected here too (this fresh test stack has none yet). Open to developers and admins only — anonymous users and patients are refused. (An API capability; the image is the live response.)"},
				Why:  demoBi{"出问题时先看事实,再做容量与质量决策。", "When something breaks, look at facts first, then decide on capacity and quality."},
				Href: "/admin", Verified: []string{"ACI roles", "ACI security"}},
			{ID: "6-3", Role: "developer", Title: demoBi{"开发者助手", "Developer assistant"},
				See:  demoBi{"用自然语言询问架构、API 与常见坑,助手基于平台的技术上下文作答(它不直接读取实时日志或数据库,提示词里写明了这一点)。(API 能力,截图为真实调用返回。)", "Ask in plain language about the architecture, the APIs and known gotchas; the assistant answers from the platform's technical context (it does not read live logs or the database — its prompt says so). (An API capability; the image is the live answer.)"},
				Why:  demoBi{"新成员也能很快读懂系统,少翻文档、少打断同事。", "New team members get up to speed without digging through docs or interrupting colleagues."},
				Href: "/admin", Verified: []string{"journey (developer.assistant)", "journey --ai=pc (real models)"}},
		}},
	{N: 7, Role: "system", Icon: "安", Title: demoBi{"安全与可靠性:上线前必须全绿", "Security and reliability: green before every deploy"},
		Intro: demoBi{"医疗相关产品最怕「看起来能用」。这里每一项都有自动化检查,并被回归图 + 部署闸门强制执行。", "Health products cannot afford “seems to work”. Each item here has automated checks, enforced by a regression graph and a deploy gate."},
		Steps: []demoStep{
			{ID: "7-1", Role: "system", Title: demoBi{"角色围栏", "Role fences"},
				See:  demoBi{"同一接口、不同身份、不同结果:匿名 401,越权 403;患者读不到医生收件箱,医生读不到系统设置。", "One endpoint, different identities, different results: anonymous gets 401, wrong role gets 403; a patient cannot read the doctor inbox and a doctor cannot read system settings."},
				Why:  demoBi{"医疗数据的第一道防线。", "The first line of defence for health data."},
				Href: "/api/health", Verified: []string{"ACI roles", "ACI security", "journey (role fences)"}},
			{ID: "7-2", Role: "system", Title: demoBi{"限流", "Rate limiting"},
				See:  demoBi{"同一 IP 反复尝试错误密码,第 11 次起返回 429 与 Retry-After;按 IP + 路径隔离,不误伤其他用户。", "Repeated bad passwords from one IP hit 429 with Retry-After; limits are per IP and path so nobody else is affected."},
				Why:  demoBi{"挡住暴力破解,也保护昂贵的 AI 调用。", "Stops brute force and protects costly AI calls."},
				Href: "/api/health", Verified: []string{"ACI ratelimit", "ACI security"}},
			{ID: "7-3", Role: "system", Title: demoBi{"输入校验", "Input validation"},
				See:  demoBi{"缺字段、弱密码、非法 JSON、超过 2 MB 的请求体,均以明确的 4xx 拒绝,而不是 500 或静默失败。", "Missing fields, weak passwords, malformed JSON and bodies over 2 MB are refused with a clear 4xx, never a 500 or a silent failure."},
				Why:  demoBi{"坏输入不会变成坏数据或崩溃。", "Bad input never becomes bad data or a crash."},
				Href: "/api/health", Verified: []string{"ACI security (body hardening)", "ACI datacontract", "Go unit tests"}},
			{ID: "7-4", Role: "system", Title: demoBi{"AI 故障时优雅降级", "Graceful AI-failure handling"},
				See:  demoBi{"上游限流、超时、无响应或返回非预期格式时,接口给出清晰提示并保持页面可用;这些行为由真实的 Go 测试逐一锁定。", "When the upstream AI rate-limits, times out, goes silent or returns an unexpected shape, the API answers clearly and the page stays usable — pinned by real Go tests."},
				Why:  demoBi{"AI 一定会偶尔出错,产品不能跟着出错。", "The AI will fail sometimes; the product must not fail with it."},
				Href: "/api/health", Verified: []string{"Go unit tests", "ACI listener (fault hooks)", "ACI datacontract"}},
			{ID: "7-5", Role: "system", Title: demoBi{"回归图与部署闸门", "Regression graph and deploy gate"},
				See:  demoBi{"vet / unit / build / wiring → integration → e2e-api → e2e-ui + 真实模型,八个节点全绿才写入通行戳;build.sh 与 deploy.sh 只认与当前代码树一致的戳。", "vet / unit / build / wiring, then integration, e2e-api, e2e-ui and the real-model leaf: the stamp is written only when all eight nodes are green, and build.sh / deploy.sh accept only a stamp matching the current code tree."},
				Why:  demoBi{"没有绿灯,就上不了线 —— 这是机制,不是承诺。", "No green light, no release — a mechanism, not a promise."},
				Href: "/api/health", Verified: []string{"regress graph (predeploy)", "regress graph (wiring node)", "scripts/deploy.sh stamp gate"}},
		}},
}
