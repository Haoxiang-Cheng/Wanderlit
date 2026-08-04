export type TravelTag = "休闲游" | "赏花" | "看海" | "特种兵" | "爬山" | "人文" | "美食";

export type CountyPoint = {
  id: string;
  name: string;
  city: string;
  province: string;
  x: number;
  y: number;
};

export type Destination = {
  id: string;
  name: string;
  county: string;
  province: string;
  x: number;
  y: number;
  tags: TravelTag[];
  accent: string;
  summary: string;
  basePerDay: number;
  travelBase: number;
  activities: string[];
  food: string[];
};

export const travelTags: TravelTag[] = [
  "休闲游",
  "赏花",
  "看海",
  "特种兵",
  "爬山",
  "人文",
  "美食",
];

export const countyPoints: CountyPoint[] = [
  { id: "110101", name: "东城区", city: "北京市", province: "北京", x: 69, y: 29 },
  { id: "110105", name: "朝阳区", city: "北京市", province: "北京", x: 70, y: 30 },
  { id: "130225", name: "乐亭县", city: "唐山市", province: "河北", x: 73, y: 32 },
  { id: "140105", name: "小店区", city: "太原市", province: "山西", x: 61, y: 35 },
  { id: "210202", name: "中山区", city: "大连市", province: "辽宁", x: 79, y: 31 },
  { id: "220104", name: "朝阳区", city: "长春市", province: "吉林", x: 82, y: 22 },
  { id: "230103", name: "南岗区", city: "哈尔滨市", province: "黑龙江", x: 85, y: 16 },
  { id: "310101", name: "黄浦区", city: "上海市", province: "上海", x: 78, y: 52 },
  { id: "320106", name: "鼓楼区", city: "南京市", province: "江苏", x: 72, y: 51 },
  { id: "330106", name: "西湖区", city: "杭州市", province: "浙江", x: 75, y: 56 },
  { id: "330523", name: "安吉县", city: "湖州市", province: "浙江", x: 72, y: 55 },
  { id: "340203", name: "弋江区", city: "芜湖市", province: "安徽", x: 69, y: 55 },
  { id: "350203", name: "思明区", city: "厦门市", province: "福建", x: 72, y: 70 },
  { id: "360202", name: "昌江区", city: "景德镇市", province: "江西", x: 67, y: 60 },
  { id: "361130", name: "婺源县", city: "上饶市", province: "江西", x: 69, y: 60 },
  { id: "370202", name: "市南区", city: "青岛市", province: "山东", x: 76, y: 41 },
  { id: "371082", name: "荣成市", city: "威海市", province: "山东", x: 80, y: 39 },
  { id: "410302", name: "老城区", city: "洛阳市", province: "河南", x: 59, y: 48 },
  { id: "410324", name: "栾川县", city: "洛阳市", province: "河南", x: 57, y: 51 },
  { id: "420106", name: "武昌区", city: "武汉市", province: "湖北", x: 62, y: 57 },
  { id: "430102", name: "芙蓉区", city: "长沙市", province: "湖南", x: 59, y: 64 },
  { id: "440104", name: "越秀区", city: "广州市", province: "广东", x: 61, y: 77 },
  { id: "445121", name: "潮安区", city: "潮州市", province: "广东", x: 69, y: 73 },
  { id: "450305", name: "七星区", city: "桂林市", province: "广西", x: 53, y: 70 },
  { id: "450321", name: "阳朔县", city: "桂林市", province: "广西", x: 54, y: 72 },
  { id: "510104", name: "锦江区", city: "成都市", province: "四川", x: 43, y: 55 },
  { id: "510181", name: "都江堰市", city: "成都市", province: "四川", x: 41, y: 53 },
  { id: "520102", name: "南明区", city: "贵阳市", province: "贵州", x: 49, y: 67 },
  { id: "530112", name: "西山区", city: "昆明市", province: "云南", x: 42, y: 72 },
  { id: "532901", name: "大理市", city: "大理州", province: "云南", x: 37, y: 70 },
  { id: "610103", name: "碑林区", city: "西安市", province: "陕西", x: 53, y: 44 },
  { id: "620102", name: "城关区", city: "兰州市", province: "甘肃", x: 44, y: 40 },
  { id: "650109", name: "米东区", city: "乌鲁木齐市", province: "新疆", x: 20, y: 29 },
  { id: "654301", name: "阿勒泰市", city: "阿勒泰地区", province: "新疆", x: 24, y: 18 },
];

export const destinations: Destination[] = [
  {
    id: "weihai",
    name: "威海海岸慢行",
    county: "荣成市",
    province: "山东",
    x: 80,
    y: 39,
    tags: ["看海", "休闲游", "美食"],
    accent: "#4f9dcc",
    summary: "沿胶东海岸追日出、逛渔村，节奏舒展，海鲜与滨海步道兼得。",
    basePerDay: 460,
    travelBase: 520,
    activities: ["半月湾日出", "火炬八街慢走", "那香海滨海步道", "成山头海岸线", "荣成渔村体验", "环海路骑行"],
    food: ["鲅鱼水饺", "海鲜蒸锅", "乳山喜饼"],
  },
  {
    id: "jingdezhen",
    name: "景德镇与婺源寻春",
    county: "昌江区",
    province: "江西",
    x: 67,
    y: 60,
    tags: ["赏花", "人文", "休闲游"],
    accent: "#d4a64a",
    summary: "从陶瓷工坊到古村花田，用手作和乡野风景填满一段温柔旅程。",
    basePerDay: 390,
    travelBase: 460,
    activities: ["御窑博物馆", "陶溪川夜游", "三宝村手作", "篁岭古村", "江湾村落", "油菜花田轻徒步"],
    food: ["冷粉", "碱水粑", "荷包红鲤鱼"],
  },
  {
    id: "dali",
    name: "大理风与洱海",
    county: "大理市",
    province: "云南",
    x: 37,
    y: 70,
    tags: ["休闲游", "爬山", "人文"],
    accent: "#61a98b",
    summary: "把苍山、洱海和古城拆成松弛的日程，适合留白与慢慢感受。",
    basePerDay: 520,
    travelBase: 760,
    activities: ["大理古城漫步", "龙龛码头日出", "喜洲古镇", "洱海生态廊道骑行", "苍山感通索道", "沙溪古镇"],
    food: ["喜洲粑粑", "白族酸辣鱼", "乳扇"],
  },
  {
    id: "guilin",
    name: "桂林山水轻徒步",
    county: "阳朔县",
    province: "广西",
    x: 54,
    y: 72,
    tags: ["爬山", "休闲游", "人文"],
    accent: "#5c9f66",
    summary: "以山水为主线，串联漓江、田园与小尺度徒步，强度可以自由调节。",
    basePerDay: 420,
    travelBase: 560,
    activities: ["象鼻山晨游", "漓江精华段", "遇龙河骑行", "相公山日出", "十里画廊", "兴坪古镇"],
    food: ["桂林米粉", "啤酒鱼", "油茶"],
  },
  {
    id: "chaozhou",
    name: "潮州古城吃喝线",
    county: "潮安区",
    province: "广东",
    x: 69,
    y: 73,
    tags: ["美食", "人文", "特种兵"],
    accent: "#c77c54",
    summary: "用高密度步行串起牌坊街、古桥与小吃铺，适合周末快速出发。",
    basePerDay: 360,
    travelBase: 430,
    activities: ["广济桥", "牌坊街", "开元寺", "韩文公祠", "西马路小吃", "凤凰洲公园"],
    food: ["牛肉火锅", "蚝烙", "鸭母捻"],
  },
  {
    id: "luoyang",
    name: "洛阳古都与栾川",
    county: "栾川县",
    province: "河南",
    x: 57,
    y: 51,
    tags: ["赏花", "爬山", "人文", "特种兵"],
    accent: "#b36b7d",
    summary: "古都遗址、博物馆与山地风景组合，适合春季赏花或紧凑深度游。",
    basePerDay: 400,
    travelBase: 420,
    activities: ["龙门石窟", "洛阳博物馆", "隋唐洛阳城", "牡丹园", "老君山", "洛邑古城夜游"],
    food: ["洛阳水席", "牛肉汤", "浆面条"],
  },
  {
    id: "anji",
    name: "安吉竹海疗愈周末",
    county: "安吉县",
    province: "浙江",
    x: 72,
    y: 55,
    tags: ["休闲游", "爬山"],
    accent: "#6e9b79",
    summary: "竹海、溪谷和小镇咖啡馆组成低负担周末，适合自驾或短途放空。",
    basePerDay: 550,
    travelBase: 320,
    activities: ["中国大竹海", "余村漫步", "白茶观景台", "山野咖啡", "灵溪山轻徒步", "竹林骑行"],
    food: ["笋干烧肉", "土鸡煲", "白茶甜品"],
  },
  {
    id: "qingdao",
    name: "青岛山海暴走",
    county: "市南区",
    province: "山东",
    x: 76,
    y: 41,
    tags: ["看海", "爬山", "特种兵", "美食"],
    accent: "#467fb2",
    summary: "老城红瓦、沿海步道与崂山快速串联，步数多但视觉回报很高。",
    basePerDay: 470,
    travelBase: 520,
    activities: ["栈桥晨景", "大学路街区", "小鱼山", "八大关", "第三海水浴场", "崂山太清线"],
    food: ["海菜凉粉", "锅贴", "袋装啤酒与海鲜"],
  },
  {
    id: "chengdu",
    name: "成都闲逛与都江堰",
    county: "锦江区",
    province: "四川",
    x: 43,
    y: 55,
    tags: ["休闲游", "美食", "人文"],
    accent: "#a67c52",
    summary: "市井茶馆、街巷美食和都江堰一日游，行程好吃又不需要赶路。",
    basePerDay: 430,
    travelBase: 580,
    activities: ["人民公园喝茶", "成都博物馆", "望平街散步", "都江堰水利工程", "灌县古城", "玉林路夜游"],
    food: ["钟水饺", "冒菜", "甜水面"],
  },
  {
    id: "altay",
    name: "阿勒泰旷野计划",
    county: "阿勒泰市",
    province: "新疆",
    x: 24,
    y: 18,
    tags: ["爬山", "休闲游"],
    accent: "#7d91aa",
    summary: "把长距离交通留足，把草原、森林和雪山放进更从容的多日计划。",
    basePerDay: 720,
    travelBase: 1500,
    activities: ["阿勒泰市区休整", "桦林公园", "将军山观景", "禾木村", "喀纳斯湖", "白哈巴村"],
    food: ["手抓肉", "奶茶", "烤包子"],
  },
];

export const defaultVisited = ["110101", "310101", "330106", "350203", "440104", "610103"];
