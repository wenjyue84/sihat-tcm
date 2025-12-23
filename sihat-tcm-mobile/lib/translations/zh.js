/**
 * Chinese (Simplified) Translations for Sihat TCM Mobile
 * 
 * 中文翻译 - 简体中文
 */

export const zh = {
    // 语言代码 - PDF生成用
    langCode: 'zh',

    // 通用 UI 字符串
    common: {
        appName: '思和中医',
        appTagline: 'AI中医诊断',
        loading: '加载中...',
        error: '错误',
        success: '成功',
        save: '保存',
        cancel: '取消',
        submit: '提交',
        next: '下一步',
        previous: '上一步',
        back: '返回',
        continue: '继续',
        skip: '跳过',
        close: '关闭',
        confirm: '确认',
        delete: '删除',
        edit: '编辑',
        view: '查看',
        search: '搜索',
        filter: '筛选',
        reset: '重置',
        retry: '重试',
        yes: '是',
        no: '否',
        or: '或',
        and: '和',
        all: '全部',
        none: '无',
        required: '必填',
        optional: '选填',
        done: '完成',
        select: '选择',
        selected: '已选',
        filled: '已填写！',
        analyzing: '分析中...',
    },

    // 语言选择器
    language: {
        title: '语言',
        selectLanguage: '选择语言',
        changeLanguage: '更改语言',
        english: 'English',
        chinese: '中文',
        malay: 'Bahasa Malaysia',
    },

    // 导航
    nav: {
        home: '首页',
        history: '历史',
        profile: '个人',
        settings: '设置',
        logout: '退出',
    },

    // 登录与认证
    login: {
        title: '思和中医',
        chineseTitle: '思和中医',
        subtitle: '选择您的身份',
        welcome: '欢迎回来',
        email: '邮箱',
        password: '密码',
        fullName: '姓名',
        signIn: '登录',
        signUp: '注册',
        orContinueWith: '或使用以下方式',
        google: 'Google',
        apple: 'Apple',
        biometric: '面容ID / 指纹',
        forgotPassword: '忘记密码？',
        noAccount: '没有账户？',
        hasAccount: '已有账户？',
        quickAccess: '快速访问 (演示)',
        roles: {
            patient: '患者',
            doctor: '医师',
            admin: '管理员',
            developer: '开发者',
        },
        roleDescriptions: {
            patient: '开始您的康复之旅',
            doctor: '践行传统医术',
            admin: '管理系统',
        },
    },

    // 基本信息表单
    basicInfo: {
        title: '患者资料',
        subtitle: '请填写您的基本信息',
        fullName: '姓名',
        fullNamePlaceholder: '请输入姓名',
        gender: '性别',
        selectGender: '选择性别',
        male: '男',
        female: '女',
        other: '其他',
        age: '年龄',
        agePlaceholder: '您的年龄',
        weight: '体重 (kg)',
        weightPlaceholder: '公斤',
        height: '身高 (cm)',
        heightPlaceholder: '厘米',
        bmi: '体质指数',
        bmiCategories: {
            underweight: '偏瘦',
            normal: '正常',
            overweight: '偏胖',
            obese: '肥胖',
        },
        bmiExplanation: {
            title: '您的BMI',
            description: '体质指数（BMI）是根据身高和体重计算的身体脂肪指标。',
            yourBmi: '您的BMI',
            howItIsCalculated: '如何计算？',
            underweight: '偏瘦',
            normal: '正常',
            overweight: '偏胖',
            obese: '肥胖',
        },
        mainConcern: '主诉',
        mainConcernPlaceholder: '描述您的主要不适...',
        otherSymptoms: '其他症状',
        otherSymptomsPlaceholder: '其他不适症状...',
        duration: '病程',
        durationPlaceholder: '多长时间？',
        durationOptions: {
            lessThan1Day: '不到1天',
            '1-3days': '1-3天',
            '4-7days': '4-7天',
            '1-2weeks': '1-2周',
            '2-4weeks': '2-4周',
            '1-3months': '1-3个月',
            '3-6months': '3-6个月',
            '6-12months': '6-12个月',
            over1Year: '超过1年',
            chronic: '慢性',
        },
        commonSymptoms: '常见症状',
        symptoms: {
            fever: '发烧',
            cough: '咳嗽',
            headache: '头痛',
            fatigue: '疲劳',
            stomachPain: '胃痛',
            soreThroat: '喉咙痛',
            shortnessOfBreath: '气短',
            highBloodPressure: '高血压',
            diabetes: '糖尿病',
            insomnia: '失眠',
            anxiety: '焦虑',
            backPain: '腰痛',
        },
    },

    // 症状步骤
    symptoms: {
        title: '症状',
        subtitle: '选择您的症状',
        searchPlaceholder: '搜索症状...',
        selectedSymptoms: '已选症状',
        noSymptomsSelected: '未选择症状',
        tapToRemove: '点击移除',
    },

    // 选择医生
    chooseDoctor: {
        title: '选择医生',
        subtitle: '选择问诊级别',
        physician: {
            name: '医师',
            nameZh: '医师',
            description: '标准问诊',
        },
        seniorPhysician: {
            name: '主任医师',
            nameZh: '主任医师',
            description: '深度分析',
        },
        masterPhysician: {
            name: '国医大师',
            nameZh: '国医大师',
            description: '专家问诊',
        },
    },

    // 诊断步骤
    steps: {
        welcome: '欢迎',
        basicInfo: '基本信息',
        symptoms: '症状',
        chooseDoctor: '医生',
        uploadReports: '报告',
        uploadMedicine: '药物',
        inquiry: '问诊',
        tongue: '舌诊',
        face: '面诊',
        audio: '闻诊',
        pulse: '切诊',
        smartConnect: '设备',
        analysis: '分析',
        results: '结果',
    },

    // 欢迎步骤
    welcome: {
        title: '欢迎使用思和中医',
        subtitle: 'AI智能中医诊断',
        description: '体验传统中医智慧与现代AI技术的完美结合。',
        startDiagnosis: '开始诊断',
        features: {
            fourPillars: '四诊合参',
            aiAnalysis: 'AI智能分析',
            personalized: '个性化建议',
        },
    },

    // 上传报告
    uploadReports: {
        title: '医疗报告',
        subtitle: '上传已有的医疗文件',
        uploadButton: '上传文件',
        takePhoto: '拍照',
        chooseFromLibrary: '从相册选择',
        noFilesYet: '暂无上传文件',
        analyzing: '分析文件中...',
        analysisComplete: '分析完成',
        removeFile: '移除',
        supportedFormats: '支持PDF、JPG、PNG格式',
        optional: '选填',
    },

    // 上传药物
    uploadMedicine: {
        title: '当前用药',
        subtitle: '上传您正在服用的药物照片',
        uploadButton: '添加药物照片',
        noMedicinesYet: '暂无添加药物',
        analyzing: '识别药物中...',
        identifiedAs: '识别为',
        optional: '选填',
    },

    // 问诊步骤
    inquiry: {
        title: '中医问诊',
        titleZh: '问诊',
        subtitle: '与AI医生对话',
        chatTitle: '健康咨询',
        inputPlaceholder: '输入您的回答...',
        send: '发送',
        doctorThinking: '医生思考中...',
        finishChat: '结束问诊',
        consultationComplete: '问诊完成',
        proceedToNext: '继续',
        quickReplies: {
            yes: '是',
            no: '否',
            sometimes: '有时',
            notSure: '不确定',
        },
    },

    // 舌诊
    tongue: {
        title: '舌诊',
        titleZh: '舌诊',
        subtitle: '拍摄舌头进行分析',
        instructions: '伸出舌头，拍摄清晰照片',
        tips: [
            '使用自然光',
            '拍照前30分钟勿进食',
            '舌头自然放松',
        ],
        takePhoto: '拍照',
        retake: '重拍',
        analyzing: '分析舌象中...',
        analysisComplete: '分析完成',
        skip: '跳过',
    },

    // 面诊
    face: {
        title: '面诊',
        titleZh: '面诊',
        subtitle: '拍摄面部进行分析',
        instructions: '拍摄正面照片',
        tips: [
            '使用自然光',
            '建议卸妆',
            '表情自然',
        ],
        takePhoto: '拍照',
        retake: '重拍',
        analyzing: '分析面色中...',
        analysisComplete: '分析完成',
        skip: '跳过',
    },

    // 闻诊
    audio: {
        title: '闻诊',
        titleZh: '闻诊',
        subtitle: '录制声音进行分析',
        instructions: '请发"啊"声5-10秒',
        startRecording: '开始录音',
        stopRecording: '停止',
        recording: '录音中...',
        recordAgain: '重新录制',
        analyzing: '分析声音中...',
        analysisComplete: '分析完成',
        tips: [
            '找安静的地方',
            '自然发声',
            '稳定手机',
        ],
        skip: '跳过',
        permissionDenied: '麦克风权限被拒绝',
        enableMicrophone: '请在设置中开启麦克风权限',
    },

    // 切诊
    pulse: {
        title: '切诊',
        titleZh: '切诊',
        subtitle: '测量脉搏',
        bpm: '次/分',
        bpmLabel: '心率',
        enterBpm: '输入心率',
        manualEntry: '手动输入',
        tapToMeasure: '点击测量',
        guideTitle: '测量方法',
        guideSteps: [
            { title: '找到脉搏点', desc: '将手指放在手腕拇指下方' },
            { title: '感受脉搏', desc: '轻轻按压直到感觉到脉搏' },
            { title: '计数', desc: '数60秒内的跳动次数' },
        ],
        normalRange: '正常范围：60-100次/分',
        categories: {
            low: '偏慢',
            normal: '正常',
            high: '偏快',
        },
        tcmQualities: '中医脉象',
        tcmQualitiesDesc: '选填 - 供中医师使用',
        pulseTypes: {
            hua: { name: '滑脉', zh: '滑脉' },
            se: { name: '涩脉', zh: '涩脉' },
            xian: { name: '弦脉', zh: '弦脉' },
            jin: { name: '紧脉', zh: '紧脉' },
            xi: { name: '细脉', zh: '细脉' },
            hong: { name: '洪脉', zh: '洪脉' },
            ruo: { name: '弱脉', zh: '弱脉' },
            chen: { name: '沉脉', zh: '沉脉' },
            fu: { name: '浮脉', zh: '浮脉' },
            chi: { name: '迟脉', zh: '迟脉' },
            shuo: { name: '数脉', zh: '数脉' },
            normal: { name: '平脉', zh: '平脉' },
        },
    },

    // 智能连接
    smartConnect: {
        title: '智能连接',
        subtitle: '连接健康设备',
        description: '从智能设备导入数据',
        pulseRate: '脉搏',
        bloodPressure: '血压',
        bloodOxygen: '血氧',
        temperature: '体温',
        connect: '连接',
        connected: '已连接',
        importHealth: '导入健康数据',
        healthApps: '健康应用',
        samsung: '三星健康',
        apple: 'Apple健康',
        google: 'Google Fit',
        skip: '跳过',
        metricsConnected: '已连接指标',
        dataTypes: {
            steps: '步数',
            sleep: '睡眠',
            heartRate: '平均心率',
            activity: '活动',
            stress: '压力',
        },
    },

    // 分析加载
    analysis: {
        title: '分析中...',
        subtitle: 'AI正在综合分析您的健康数据',
        pleaseWait: '请稍候',
        steps: [
            '收集数据...',
            '分析症状...',
            '处理观察结果...',
            '生成诊断...',
            '准备建议...',
        ],
        didYouKnow: '您知道吗？',
        facts: [
            '中医已有两千多年历史',
            '舌象反映脏腑健康',
            '脉诊可辨别28种脉象',
            '阴阳平衡是健康之本',
        ],
    },

    // 结果 / 报告
    report: {
        title: '诊断报告',
        generatedOn: '生成于',
        patientInfo: '患者信息',
        constitution: '体质',
        diagnosis: '诊断',
        recommendations: '建议',
        dietaryAdvice: '饮食建议',
        foodsToEat: '宜食',
        foodsToAvoid: '忌食',
        lifestyle: '生活方式',
        herbalFormula: '方剂',
        acupoints: '穴位',
        share: '分享',
        saveToHistory: '保存到历史',
        newDiagnosis: '新诊断',
        askQuestion: '提问',
        chatAboutReport: '咨询报告',
        disclaimer: '本报告仅供参考，请咨询持证中医师获取医疗建议。',
        sections: {
            overview: '概览',
            tcmAnalysis: '中医分析',
            dietary: '食疗',
            lifestyle: '养生',
            treatment: '治疗',
        },
        pdf: {
            download: 'PDF',
            generating: '正在生成PDF...',
            success: 'PDF生成成功',
            error: 'PDF生成失败',
        },
    },

    // 报告聊天
    reportChat: {
        title: '咨询您的报告',
        subtitle: 'AI中医助手',
        inputPlaceholder: '询问您的诊断...',
        suggestions: [
            '我的诊断是什么意思？',
            '为什么要忌口？',
            '如何改善体质？',
            '解释穴位按摩',
        ],
    },

    // 仪表盘
    dashboard: {
        greeting: {
            morning: '早上好',
            afternoon: '下午好',
            evening: '晚上好',
        },
        welcome: '欢迎',
        startDiagnosis: '开始诊断',
        recentHistory: '最近记录',
        viewAll: '查看全部',
        noHistory: '暂无诊断记录',
        noHistoryDesc: '开始您的第一次中医诊断',
        tabs: {
            home: '首页',
            history: '历史',
            profile: '我的',
        },
    },

    // 历史
    history: {
        title: '历史记录',
        subtitle: '您的诊断记录',
        noRecords: '暂无记录',
        viewReport: '查看报告',
        deleteRecord: '删除',
        confirmDelete: '删除此记录？',
    },

    // 查看报告页面
    viewReport: {
        title: '查看报告',
        noReport: '暂无报告',
        share: '分享',
        sharing: '分享中...',
        shareSuccess: '分享成功',
        shareError: '分享失败',
        medicalReport: '医疗报告',
        generatedBy: '由思和中医生成',
    },

    // 个人资料
    profile: {
        title: '个人资料',
        personalInfo: '个人信息',
        healthInfo: '健康信息',
        preferences: '偏好设置',
        language: '语言',
        theme: '主题',
        notifications: '通知',
        about: '关于',
        version: '版本',
        logout: '退出登录',
        confirmLogout: '确定要退出吗？',
        editProfile: '编辑资料',
        saveChanges: '保存更改',
    },

    // 错误
    errors: {
        generic: '出错了',
        network: '网络错误',
        timeout: '请求超时',
        unauthorized: '请重新登录',
        notFound: '未找到',
        tryAgain: '重试',
        goBack: '返回',
        permissionDenied: '权限被拒绝',
        cameraError: '相机错误',
        microphoneError: '麦克风错误',
        analysisError: '分析失败',
    },

    // 成功消息
    success: {
        saved: '保存成功',
        updated: '更新成功',
        deleted: '删除成功',
        copied: '已复制',
        shared: '分享成功',
    },

    // 资料确认步骤
    profileSummary: {
        title: '资料确认',
        subtitle: '请确认您的信息',
        anonymous: '患者',
        yearsOld: '岁',
        profileReady: '资料已完整',
        profileIncomplete: '请完善您的资料',
        missingFields: '部分信息缺失',
        continueToSymptoms: '继续填写症状',
        completeProfile: '完善我的资料',
        editProfile: '编辑资料',
        wantToEdit: '想要更新您的资料？',
    },

    // 确认对话框
    confirm: {
        delete: '确定删除？',
        logout: '退出登录？',
        discard: '放弃更改？',
        exitDiagnosis: '退出诊断？进度将丢失。',
    },

    // 信息图
    infographic: {
        title: '创建信息图',
        subtitle: '将报告转换为视觉内容',
        selectStyle: '选择风格',
        selectContent: '选择内容',
        generating: '生成中...',
        generated: '信息图已生成！',
        save: '保存到相册',
        share: '分享',
        close: '关闭',
        generate: '生成',
        tip: '💡 信息图非常适合与家人分享！',
        error: '生成失败，请重试。',
        saved: '已保存到相册！',
        permissionDenied: '需要权限才能保存照片',
        styles: {
            modern: '现代',
            modernDesc: '简洁专业',
            traditional: '传统',
            traditionalDesc: '经典中医风格',
            minimal: '极简',
            minimalDesc: '简单优雅',
            colorful: '彩色',
            colorfulDesc: '活力四射',
        },
        content: {
            diagnosis: '诊断与体质',
            dietary: '饮食建议',
            lifestyle: '生活方式',
            acupoints: '穴位按摩',
            exercise: '运动建议',
            metrics: '健康指标',
        },
    },

    // 医生验证
    verification: {
        buttonLabel: '验证',
        modalTitle: '申请医师验证',
        modalSubtitle: '让持证中医师审核您的AI诊断结果',
        selectDoctor: '选择医师',
        noSelection: '跳过 - 发送给任何可用医师',
        specialties: '专长',
        experience: '经验',
        confirmTitle: '确认验证申请',
        confirmMessage: '您的完整诊断报告将被发送以供专业审核。验证完成后，您将收到通知。',
        sendRequest: '发送申请',
        cancel: '取消',
        successTitle: '申请已发送！',
        successMessage: '您的诊断已发送验证。审核完成后您将收到通知。',
        errorTitle: '错误',
        errorMessage: '无法发送验证请求。请重试。',
        noPractitioners: '目前暂无可用医师。',
    },

    // 西医医生聊天
    westernChat: {
        title: '西医专家意见',
        subtitle: '基于循证医学的视角',
        intro: '你好。我是史密斯医生。我已经查看了您的中医报告。从西医的角度，我可以帮助将这些发现转化为生理术语，并建议标准评估。我能为您提供什么帮助？',
        placeholder: '咨询史密斯医生...',
        error: '抱歉，目前连接出现问题。',
        questions: {
            opinion: '西医如何看待？',
            tests: '我应该做哪些实验室检查？',
            science: '这有科学依据吗？',
            redFlags: '有什么危险信号吗？',
        },
    },
};

