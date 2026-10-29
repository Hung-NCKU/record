/*
 * 跟健身養寵共用的清單。這裡是複本，來源：
 *   動作名稱  fit/shared/workout-catalog.json
 *   有氧活動  fit/shared/exercise-energy.js
 *   記帳分類  fit/shared/expenses.js
 * 分類 id 必須跟 fit 一樣，不然匯入時會被歸到「其他」。
 */
window.FIT_DATA = {
  exercises: {
    chest: ['槓鈴臥推', '伏地挺身', '上斜啞鈴臥推', '平板啞鈴臥推', '平板啞鈴飛鳥', '上斜啞鈴飛鳥', '滑輪交叉夾胸', '高位滑輪夾胸', '低位滑輪夾胸', '上斜槓鈴臥推', '下斜槓鈴臥推', '蝴蝶機夾胸', '下斜啞鈴臥推', '扶高伏地挺身', '彈力帶低位夾胸', '彈力帶水平夾胸', '彈力帶高位夾胸'],
    back: ['滑輪下拉', '坐姿滑輪划船', '槓鈴俯身划船', '單臂啞鈴划船', '雙臂啞鈴俯身划船', '繩索面拉', '支撐式啞鈴肩外旋', '輔助引體向上', '引體向上', '彈力帶俯身划船', '彈力帶高位下拉', '彈力帶直臂下拉', '彈力帶肩外旋'],
    shoulders: ['啞鈴肩推', '啞鈴側平舉', '派克伏地挺身'],
    arms: ['槓鈴二頭彎舉', '交替啞鈴彎舉', '滑輪三頭下壓', '啞鈴槌式彎舉', '啞鈴三頭後踢', '彈力帶二頭彎舉', '窄距伏地挺身'],
    legs: ['槓鈴深蹲', '高腳杯深蹲', '羅馬尼亞硬舉', '臀橋', '單腳提踵', '坐姿腿推', '坐姿腿伸展', '俯臥腿彎舉', '徒手弓箭步', '保加利亞分腿蹲', '槓鈴臀推', '槓鈴前蹲', '徒手深蹲', '臀橋腿後走步'],
    core: ['棒式', '捲腹', '懸垂舉腿', '鳥狗式'],
    cardio: ['快走', '跑步', '騎腳踏車', '室內飛輪', '橢圓機', '跳繩', '游泳', '登階／樓梯', '籃球', '足球', '網球', '羽球', '桌球', '排球', '棒壘球', '匹克球', '高爾夫'],
    other: [],
  },
  // 用秒數記的動作（catalog 裡 mode: "time"）
  timed: ['棒式'],
  categories: [
    { id: 'food', name: '餐飲', icon: '🍜', kind: 'expense' },
    { id: 'drink', name: '飲料點心', icon: '🧋', kind: 'expense' },
    { id: 'grocery', name: '生活採買', icon: '🧺', kind: 'expense' },
    { id: 'transport', name: '交通', icon: '🚌', kind: 'expense' },
    { id: 'shopping', name: '購物', icon: '🛍️', kind: 'expense' },
    { id: 'entertain', name: '娛樂', icon: '🎬', kind: 'expense' },
    { id: 'home', name: '居家水電', icon: '🏠', kind: 'expense' },
    { id: 'medical', name: '醫療', icon: '💊', kind: 'expense' },
    { id: 'learn', name: '教育學習', icon: '📚', kind: 'expense' },
    { id: 'social', name: '人情社交', icon: '🎁', kind: 'expense' },
    { id: 'fitness', name: '運動健身', icon: '🏋️', kind: 'expense' },
    { id: 'other', name: '其他', icon: '📦', kind: 'expense' },
    { id: 'salary', name: '薪水', icon: '💼', kind: 'income' },
    { id: 'bonus', name: '獎金', icon: '🎉', kind: 'income' },
    { id: 'invest', name: '投資', icon: '📈', kind: 'income' },
    { id: 'refund', name: '退款回饋', icon: '↩️', kind: 'income' },
    { id: 'other_income', name: '其他收入', icon: '💰', kind: 'income' },
  ],
  mealTypes: { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '點心' },
  workoutCategories: { legs: '腿', chest: '胸', back: '背', shoulders: '肩', arms: '手臂', core: '核心', cardio: '有氧', other: '其他' },
  payMethods: { cash: '現金', card: '信用卡', mobile: '行動支付', transfer: '轉帳', ticket: '交通卡' },
};
