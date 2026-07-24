const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  mood: null,
  area: ["neck"],
  place: "class",
  duration: 180,
  currentExercise: 0,
  timer: null,
  remaining: 30,
  running: false,
  records: JSON.parse(localStorage.getItem("teumpyeo-records") || "[]"),
  reminders: JSON.parse(localStorage.getItem("teumpyeo-reminders") || "{}"),
  deliveredReminderKeys: new Set(),
  reminderTicker: null,
  pushConnected: false
};

const labels = {
  area: { neck: "목", shoulder: "어깨", upper: "등 위쪽", lower: "허리", all: "전신" },
  place: { class: "교실", study: "독서실", home: "집", outside: "야외" }
};

const illustrations = {
  chin: `<svg class="exercise-svg" viewBox="0 0 420 330" aria-label="의자에 바르게 앉아 턱을 뒤로 당기는 자세 도해"><path d="M115 277h205M142 164v113M142 213h115v64M257 213v64"/><path class="body-fill" d="M210 62c-28 0-45 22-41 49 2 15 11 27 24 33l-2 32c-20 8-32 20-39 38h105c-7-20-21-31-40-38l-1-31c14-7 22-20 22-36 0-25-10-47-28-47Z"/><path d="M192 176c8 12 18 17 27 0M169 108h69M208 74v53"/><path class="motion" d="M278 103h-56M268 93l10 10-10 10"/><path class="arrow" d="m222 103 12-7v14z"/><path d="M185 96c4 3 9 3 13 0"/></svg>`,
  shoulder: `<svg class="exercise-svg" viewBox="0 0 420 330" aria-label="의자에 앉아 어깨를 천천히 돌리는 자세 도해"><path d="M108 278h220M145 166v112M145 214h125v64M270 214v64"/><path class="body-fill" d="M211 55c-25 0-41 21-38 45 2 17 10 28 25 35v31c-30 6-53 25-61 49h147c-8-25-31-43-61-49v-32c14-7 22-20 22-36 0-24-13-43-34-43Z"/><path d="M198 166c8 10 18 10 26 0M169 189l-27 30M253 189l29 30"/><path class="motion" d="M137 151c-15 5-25 17-24 34M113 185l-6-12M113 185l11-7M286 151c15 5 25 17 24 34M310 185l6-12M310 185l-11-7"/></svg>`,
  side: `<svg class="exercise-svg" viewBox="0 0 420 330" aria-label="고개를 옆으로 기울여 목 옆을 늘리는 자세 도해"><path d="M105 279h220M145 170v109M145 215h126v64M271 215v64"/><path class="body-fill" d="M233 61c-23-8-46 5-53 29-5 16-1 31 11 43l-11 31c-28 8-45 25-52 50h151c-5-25-23-42-50-50l8-28c17-2 29-11 36-27 9-23 0-41-20-48Z"/><path d="M180 164c11 11 25 12 49 0M168 193l-22 22M251 192l21 23M200 81l45 39"/><path class="motion" d="M273 56c19 10 27 27 22 48M295 104l-6-12M295 104l11-6"/></svg>`,
  chest: `<svg class="exercise-svg" viewBox="0 0 420 330" aria-label="서서 두 손을 뒤로 모아 가슴을 여는 자세 도해"><path d="M104 280h220"/><path class="body-fill" d="M211 52c-23 0-39 19-38 43 1 16 10 29 24 35v33c-29 7-49 26-53 55l24 62h84l24-62c-5-29-25-48-53-55v-33c14-7 22-20 22-36 0-24-13-42-34-42Z"/><path d="M197 163c8 9 18 9 26 0M167 185c-26 26-28 43-7 59l39-18M255 185c26 26 28 43 7 59l-39-18M201 226h20"/><path class="motion" d="M140 185c-17-7-26-20-27-37M113 148l-6 12M113 148l12 5M282 185c17-7 26-20 27-37M309 148l6 12M309 148l-12 5"/></svg>`,
  back: `<svg class="exercise-svg" viewBox="0 0 420 330" aria-label="의자에 앉아 골반과 허리를 바르게 세우는 자세 도해"><path d="M95 280h240M132 174v106M132 222h132v58M264 222v58"/><circle class="body-fill" cx="204" cy="69" r="28"/><path class="body-fill" d="M196 97c-12 30-14 61-4 92 12 16 30 21 51 17l17-36c-25-12-33-38-30-68-9-6-21-7-34-5Z"/><path d="M193 188c16 12 32 17 50 18M243 206l-4 46M190 188l-15 64"/><path class="motion" d="M274 132c18 14 21 36 8 54M282 186l-1-13M282 186l12-5"/></svg>`,
  floor: `<svg class="exercise-svg" viewBox="0 0 420 330" aria-label="바닥에 누워 무릎을 움직여 허리를 편안하게 하는 자세 도해"><path d="M62 252h300"/><circle class="body-fill" cx="96" cy="218" r="24"/><path class="body-fill" d="M119 229c48-6 94-5 137 5l44 2 36 16H119Z"/><path d="M177 232c22-38 45-56 69-50 18 4 23 23 10 52M246 182l34 54M145 236l45-30 39-13"/><path class="motion" d="M221 155c19-14 41-10 56 7M277 162l-13-2M277 162l-4-12"/></svg>`
};

const exerciseBank = [
  { id:"chin_tuck", visual:"chin", areas:["neck"], places:["class","study","home","outside"], name:"턱 당기기", type:"목 정렬", instruction:"허리를 세우고 시선은 정면에 둔 채 턱을 수평으로 천천히 뒤로 당겨요.", do:"뒤통수가 위로 길어지는 느낌", dont:"턱을 아래로 세게 누르지 않기", cues:["시선은 정면","턱은 수평 이동","허리는 곧게"] },
  { id:"neck_side", visual:"side", areas:["neck"], places:["class","study","home","outside"], name:"목 옆 늘이기", type:"목 이완", instruction:"한쪽 귀를 같은 쪽 어깨 방향으로 기울여 목 옆을 부드럽게 늘려요. 반대쪽도 반복해요.", do:"양쪽 어깨를 낮게 유지", dont:"손으로 머리를 강하게 당기지 않기", cues:["어깨는 낮게","귀를 옆으로","양쪽 번갈아"] },
  { id:"neck_turn", visual:"side", areas:["neck"], places:["class","study","home","outside"], name:"고개 좌우로 돌리기", type:"목 가동성", instruction:"턱의 높이를 유지하며 고개를 한쪽으로 천천히 돌렸다가 가운데로 돌아와요.", do:"통증 없는 범위까지만", dont:"끝 지점에서 반동 주지 않기", cues:["턱 높이 유지","몸통은 정면","천천히 왕복"] },
  { id:"neck_nod", visual:"chin", areas:["neck"], places:["class","study","home"], name:"작게 끄덕이기", type:"깊은 목근육", instruction:"뒤통수를 위로 길게 세운 상태에서 ‘네’라고 답하듯 고개를 아주 작게 끄덕여요.", do:"목 뒤가 길어진 상태 유지", dont:"고개를 크게 숙이지 않기", cues:["움직임은 작게","턱 힘 빼기","목 뒤 길게"] },
  { id:"levator", visual:"side", areas:["neck","shoulder"], places:["class","study","home"], name:"대각선 목 늘이기", type:"목·어깨 이완", instruction:"고개를 한쪽 겨드랑이 방향으로 살짝 숙여 목 뒤쪽과 어깨 위를 늘려요.", do:"반대쪽 어깨는 낮게", dont:"등을 둥글게 말지 않기", cues:["대각선 아래 보기","어깨 고정","반동 없이"] },
  { id:"neck_isometric", visual:"chin", areas:["neck"], places:["class","study","home"], name:"손바닥 목 버티기", type:"목 안정화", instruction:"손바닥을 이마에 대고 고개는 움직이지 않은 채 서로 가볍게 밀어 5초간 버텨요.", do:"힘은 약하게 시작", dont:"숨을 참거나 세게 밀지 않기", cues:["고개는 움직이지 않기","5초 유지","편하게 호흡"] },

  { id:"shoulder_roll", visual:"shoulder", areas:["shoulder"], places:["class","study","home","outside"], name:"어깨 천천히 돌리기", type:"어깨 이완", instruction:"양쪽 어깨를 귀 쪽으로 올렸다가 뒤로 크게 돌려 편안하게 내려요.", do:"숨을 내쉬며 어깨 내리기", dont:"빠르게 돌리지 않기", cues:["위로 올리기","뒤로 돌리기","아래로 놓기"] },
  { id:"scapular_squeeze", visual:"chest", areas:["shoulder","upper"], places:["class","study","home","outside"], name:"날개뼈 모으기", type:"등 위쪽 활성화", instruction:"팔꿈치를 몸 옆에 두고 양쪽 날개뼈를 뒤쪽 주머니로 모으듯 당겼다가 풀어요.", do:"목과 어깨 힘은 빼기", dont:"허리를 앞으로 밀지 않기", cues:["팔꿈치는 몸 옆","날개뼈 모으기","목 힘 빼기"] },
  { id:"shoulder_shrug", visual:"shoulder", areas:["shoulder"], places:["class","study","home","outside"], name:"어깨 올렸다 놓기", type:"승모근 이완", instruction:"숨을 들이마시며 어깨를 귀 쪽으로 올리고, 내쉬면서 힘을 빼 툭 내려놓아요.", do:"내려놓을 때 완전히 이완", dont:"어깨를 앞쪽으로 말지 않기", cues:["숨 들이마시기","어깨 올리기","내쉬며 놓기"] },
  { id:"cross_arm", visual:"chest", areas:["shoulder"], places:["class","study","home","outside"], name:"팔 가슴 앞으로 당기기", type:"어깨 뒤쪽 이완", instruction:"한 팔을 가슴 앞으로 뻗고 반대 팔로 감싸 몸 쪽으로 부드럽게 당겨요.", do:"어깨를 아래로 유지", dont:"팔꿈치 관절을 누르지 않기", cues:["팔은 가슴 높이","어깨 낮게","양쪽 번갈아"] },
  { id:"wall_slide", visual:"chest", areas:["shoulder","upper"], places:["home","outside"], name:"벽 타고 팔 올리기", type:"어깨 가동성", instruction:"등을 벽에 가볍게 대고 팔을 벽을 따라 통증 없는 높이까지 올렸다 내려요.", do:"갈비뼈가 들리지 않게", dont:"통증을 참고 끝까지 올리지 않기", cues:["등은 벽에","팔은 천천히","통증 전까지만"] },
  { id:"eagle_arms", visual:"chest", areas:["shoulder","upper"], places:["class","study","home"], name:"팔꿈치 감싸기", type:"어깨 사이 이완", instruction:"양팔을 앞으로 뻗어 팔꿈치를 포개고 자신을 안듯 어깨 뒤를 넓혀요.", do:"등 위쪽이 넓어지는 느낌", dont:"어깨를 귀 쪽으로 올리지 않기", cues:["팔꿈치 포개기","등 넓히기","어깨 낮게"] },

  { id:"chest_open", visual:"chest", areas:["upper","shoulder"], places:["class","study","home","outside"], name:"가슴 열기", type:"말린 어깨 이완", instruction:"두 손을 등 뒤에서 가볍게 모으고 어깨를 뒤로 보내 가슴 앞을 열어요.", do:"허리는 편안한 중립 유지", dont:"허리를 과하게 꺾지 않기", cues:["어깨는 뒤·아래","가슴 앞 열기","허리 중립"] },
  { id:"seated_extension", visual:"chest", areas:["upper"], places:["class","study","home"], name:"의자 등받이 펴기", type:"등 위쪽 신전", instruction:"손을 머리 뒤에 가볍게 대고 등받이 위로 가슴을 열며 등 위쪽만 부드럽게 펴요.", do:"팔꿈치를 편안하게 열기", dont:"목이나 허리를 꺾지 않기", cues:["등 위쪽만","가슴을 열기","목은 편안하게"] },
  { id:"seated_twist", visual:"side", areas:["upper"], places:["class","study","home"], name:"앉아서 몸통 돌리기", type:"등 회전", instruction:"골반은 정면에 두고 가슴부터 한쪽으로 천천히 돌렸다가 중앙으로 돌아와요.", do:"키가 커지는 느낌 유지", dont:"무릎과 골반을 함께 돌리지 않기", cues:["골반은 정면","가슴부터 회전","양쪽 번갈아"] },
  { id:"overhead_reach", visual:"chest", areas:["upper","shoulder"], places:["class","home","outside"], name:"양팔 위로 길게 뻗기", type:"전신 정렬", instruction:"손가락을 깍지 끼고 손바닥을 위로 향해 양팔을 길게 뻗으며 몸통을 세워요.", do:"어깨와 귀 사이 공간 만들기", dont:"허리를 앞으로 과하게 내밀지 않기", cues:["손바닥은 위","몸통 길게","갈비뼈 내리기"] },
  { id:"side_reach", visual:"side", areas:["upper"], places:["class","home","outside"], name:"옆구리 길게 늘이기", type:"몸통 측면 이완", instruction:"한 팔을 머리 위로 올리고 몸통을 반대쪽으로 살짝 기울여 옆구리를 늘려요.", do:"양쪽 엉덩이에 체중 유지", dont:"몸통이 앞으로 숙지지 않기", cues:["팔은 귀 옆","옆으로 기울기","몸통은 정면"] },
  { id:"doorway_chest", visual:"chest", areas:["upper","shoulder"], places:["home"], name:"문틀 가슴 스트레칭", type:"가슴 앞 이완", instruction:"팔뚝을 문틀에 가볍게 대고 한 발 앞으로 이동해 가슴 앞을 부드럽게 늘려요.", do:"어깨를 낮게 유지", dont:"팔에 저림이 생길 만큼 밀지 않기", cues:["팔뚝은 문틀에","한 발 앞으로","어깨 낮게"] },

  { id:"seated_pelvic_tilt", visual:"back", areas:["lower"], places:["class","study","home"], name:"앉아서 골반 기울이기", type:"허리 가동성", instruction:"의자에 편하게 앉아 골반을 천천히 앞뒤로 기울이며 허리의 자연스러운 곡선을 찾아요.", do:"움직임을 작고 부드럽게", dont:"통증이 나는 끝 범위까지 밀지 않기", cues:["발은 바닥에","골반만 움직이기","천천히 왕복"] },
  { id:"seated_spine_tall", visual:"back", areas:["lower"], places:["class","study","home","outside"], name:"의자에서 허리 세우기", type:"허리 정렬", instruction:"발바닥을 바닥에 두고 정수리와 골반이 서로 멀어지듯 몸통을 길게 세워요.", do:"갈비뼈를 골반 위에 두기", dont:"가슴을 과하게 내밀지 않기", cues:["발바닥 고정","몸통 길게","허리 중립"] },
  { id:"standing_side_lower", visual:"side", areas:["lower"], places:["home","outside"], name:"서서 옆 허리 늘이기", type:"허리 옆 이완", instruction:"한 팔을 머리 위로 올리고 골반은 가운데 둔 채 몸통을 반대쪽으로 살짝 기울여요.", do:"양발에 체중을 고르게", dont:"몸통을 비틀거나 앞으로 숙이지 않기", cues:["골반은 가운데","옆으로만","양쪽 번갈아"] },
  { id:"standing_back_extension", visual:"back", areas:["lower"], places:["home","outside"], name:"서서 허리 가볍게 펴기", type:"허리 신전", instruction:"양손을 골반 뒤에 대고 가슴을 열면서 몸통을 아주 조금 뒤로 이동했다 돌아와요.", do:"통증 없는 작은 범위", dont:"목을 젖히거나 허리를 꺾지 않기", cues:["손은 골반 뒤","가슴 열기","범위는 작게"] },
  { id:"single_knee_chest", visual:"floor", areas:["lower"], places:["home"], name:"한쪽 무릎 당기기", type:"허리·엉덩이 이완", instruction:"바닥에 누워 한쪽 무릎을 가슴 방향으로 편안하게 당기고 반대쪽 다리는 힘을 빼요.", do:"허리가 편안한 범위에서 유지", dont:"무릎을 강하게 누르지 않기", cues:["어깨 힘 빼기","한쪽씩 당기기","편하게 호흡"] },
  { id:"bridge", visual:"floor", areas:["lower"], places:["home"], name:"엉덩이 들어 올리기", type:"허리 주변 안정화", instruction:"무릎을 세우고 누워 엉덩이에 힘을 주며 골반을 천천히 들어 몸통과 허벅지를 잇고 내려와요.", do:"엉덩이 힘으로 들어 올리기", dont:"허리를 먼저 과하게 꺾지 않기", cues:["발은 골반 너비","엉덩이에 힘","천천히 내리기"] }
];

const visualGuides = {
  chin: {
    svg: `<path class="pose-guide" d="M208 40v142"/><path class="pose-guide-warm" d="M286 104h-58m48-8 10 8-10 8"/><rect class="pose-label-bg" x="273" y="65" width="88" height="27" rx="10"/><text class="pose-label pose-label-warm" x="317" y="83" text-anchor="middle">턱을 뒤로</text>`,
    cues: ["시선은 정면", "턱은 수평 이동", "허리는 곧게"]
  },
  shoulder: {
    svg: `<path class="pose-guide-warm" d="M106 145c-22 17-24 45-7 63m214-63c22 17 24 45 7 63"/><rect class="pose-label-bg" x="147" y="18" width="128" height="27" rx="10"/><text class="pose-label pose-label-warm" x="211" y="36" text-anchor="middle">위 → 뒤 → 아래</text>`,
    cues: ["양쪽을 함께", "뒤로 크게 돌리기", "내쉬며 내려놓기"]
  },
  side: {
    svg: `<path class="pose-guide" d="M208 42v125"/><path class="pose-guide-warm" d="M280 52c20 12 25 35 14 55"/><rect class="pose-label-bg" x="268" y="118" width="104" height="27" rx="10"/><text class="pose-label pose-label-warm" x="320" y="136" text-anchor="middle">귀를 어깨 쪽으로</text>`,
    cues: ["어깨는 낮게", "몸통은 정면", "반동 없이 천천히"]
  },
  chest: {
    svg: `<path class="pose-guide" d="M211 38v245"/><path class="pose-guide-warm" d="M125 178c-18-9-28-22-30-39m202 39c18-9 28-22 30-39"/><rect class="pose-label-bg" x="164" y="18" width="94" height="27" rx="10"/><text class="pose-label pose-label-warm" x="211" y="36" text-anchor="middle">가슴 열기</text>`,
    cues: ["어깨는 뒤·아래", "가슴 앞을 열기", "허리는 꺾지 않기"]
  },
  back: {
    svg: `<path class="pose-guide" d="M204 35v176"/><path class="pose-guide-warm" d="M277 127c18 17 20 40 5 59"/><rect class="pose-label-bg" x="270" y="92" width="106" height="27" rx="10"/><text class="pose-label pose-label-warm" x="323" y="110" text-anchor="middle">골반부터 세우기</text>`,
    cues: ["발은 바닥에", "골반은 가운데", "허리는 편안하게"]
  },
  floor: {
    svg: `<path class="pose-guide" d="M65 252h300"/><path class="pose-guide-warm" d="M219 154c18-13 42-10 58 8"/><rect class="pose-label-bg" x="264" y="119" width="104" height="27" rx="10"/><text class="pose-label pose-label-warm" x="316" y="137" text-anchor="middle">무릎은 천천히</text>`,
    cues: ["어깨 힘 빼기", "허리는 편안하게", "반동 없이"]
  }
};

const poseScenes = {
  seated: `<path class="pose-scene" d="M102 250h220M130 145v105M130 188h130v62M260 188v62"/>`,
  standing: `<path class="pose-scene" d="M90 258h240"/>`,
  wall: `<path class="pose-scene" d="M105 30v228M82 258h250"/>`,
  doorway: `<path class="pose-scene" d="M95 35v223M325 35v223M75 258h270"/>`,
  floor: `<path class="pose-scene" d="M55 246h315"/>`
};

const poseDiagrams = {
  chin_tuck: { scene:"seated", label:"턱을 뒤로", body:`<circle class="pose-ghost" cx="234" cy="62" r="23"/><circle class="pose-head" cx="205" cy="62" r="23"/><path class="pose-figure" d="M205 85v91M205 112l-34 37M205 112l34 37M205 176l55 12v55M205 176l-35 67"/>`, motion:`M270 62h-34` },
  neck_side: { scene:"seated", label:"귀를 어깨 쪽으로", body:`<circle class="pose-head" cx="188" cy="65" r="23"/><path class="pose-figure" d="M203 84l13 21v71M216 112l-34 36M216 112l34 36M216 176l48 12v55M216 176l-34 67"/><path class="pose-ghost" d="M216 33v55"/>`, motion:`M260 48c-18-24-43-26-60-5` },
  neck_turn: { scene:"seated", label:"고개만 좌우로", body:`<ellipse class="pose-head" cx="210" cy="62" rx="17" ry="24"/><path class="pose-figure" d="M210 86v90M210 112l-35 36M210 112l35 36M210 176l52 12v55M210 176l-35 67"/><path class="pose-figure" d="M204 61h13"/>`, motion:`M164 55c20-26 72-26 94 0` },
  neck_nod: { scene:"seated", label:"아주 작게 끄덕이기", body:`<circle class="pose-head" cx="210" cy="62" r="23"/><path class="pose-figure" d="M210 85v91M210 112l-34 37M210 112l34 37M210 176l52 12v55M210 176l-34 67"/><path class="pose-ghost" d="M190 43c20-18 43-7 46 12"/>`, motion:`M244 61c2 18-8 29-23 35` },
  levator: { scene:"seated", label:"겨드랑이 쪽 보기", body:`<circle class="pose-head" cx="184" cy="82" r="22"/><path class="pose-figure" d="M199 98l18 17v61M217 119l-36 28M217 119l34 28M217 176l47 12v55M217 176l-35 67"/>`, motion:`M254 47c-31 4-52 20-62 43` },
  neck_isometric: { scene:"seated", label:"고개는 그대로", body:`<circle class="pose-head" cx="210" cy="62" r="23"/><path class="pose-figure" d="M210 85v91M210 111l46-24M210 111l-34 38M256 87l-24-18M210 176l52 12v55M210 176l-34 67"/><circle class="pose-joint" cx="231" cy="69" r="6"/>`, motion:`M272 70h-26M247 56v28` },
  shoulder_roll: { scene:"seated", label:"위 → 뒤 → 아래", body:`<circle class="pose-head" cx="210" cy="56" r="22"/><path class="pose-figure" d="M210 79v97M210 112l-43 34M210 112l43 34M210 176l52 12v55M210 176l-35 67"/><circle class="pose-joint" cx="181" cy="105" r="7"/><circle class="pose-joint" cx="239" cy="105" r="7"/>`, motion:`M150 122c-22-31-5-62 25-67M270 122c22-31 5-62-25-67` },
  scapular_squeeze: { scene:"seated", label:"날개뼈를 가운데로", body:`<circle class="pose-head" cx="210" cy="53" r="21"/><path class="pose-figure" d="M210 75v101M210 106l-52 25 28 34M210 106l52 25-28 34M210 176l48 12v55M210 176l-32 67"/>`, motion:`M138 109h42M282 109h-42` },
  shoulder_shrug: { scene:"seated", label:"올렸다가 툭", body:`<circle class="pose-head" cx="210" cy="52" r="21"/><path class="pose-figure" d="M210 74v102M210 105l-36 8-16 53M210 105l36 8 16 53M210 176l50 12v55M210 176l-34 67"/><path class="pose-ghost" d="M169 136l-12 30M251 136l12 30"/>`, motion:`M168 154V116M252 154V116` },
  cross_arm: { scene:"seated", label:"팔을 가슴 앞으로", body:`<circle class="pose-head" cx="210" cy="54" r="21"/><path class="pose-figure" d="M210 76v100M210 108l-50 24 92 8M210 116l45 31M210 176l50 12v55M210 176l-34 67"/>`, motion:`M289 140h-32` },
  wall_slide: { scene:"wall", label:"벽을 따라 위로", body:`<circle class="pose-head" cx="160" cy="58" r="21"/><path class="pose-figure" d="M160 80v105M160 104l-28-35-14-35M160 104l28-35 14-35M160 185l-18 68M160 185l26 68"/>`, motion:`M119 112V45M201 112V45` },
  eagle_arms: { scene:"seated", label:"팔꿈치를 포개기", body:`<circle class="pose-head" cx="210" cy="51" r="20"/><path class="pose-figure" d="M210 73v103M210 104l-42 37 75 5M210 104l40 39-72 4M210 176l50 12v55M210 176l-34 67"/><circle class="pose-joint" cx="210" cy="144" r="8"/>`, motion:`M151 128c18 14 36 19 55 17M269 128c-18 14-36 19-55 17` },
  chest_open: { scene:"standing", label:"가슴 앞을 열기", body:`<circle class="pose-head" cx="210" cy="47" r="21"/><path class="pose-figure" d="M210 69v111M210 101l-50 37 32 39M210 101l50 37-32 39M192 177h36M210 180l-30 73M210 180l30 73"/>`, motion:`M160 118c-20-7-34-21-39-40M260 118c20-7 34-21 39-40` },
  seated_extension: { scene:"seated", label:"등 위쪽만 펴기", body:`<circle class="pose-head" cx="236" cy="53" r="21"/><path class="pose-figure" d="M222 70c-28 26-26 71-5 106M223 88l-37-25-28 22M223 88l34-25 25 24M217 176l45 12v55M217 176l-34 67"/><path class="pose-ghost" d="M205 75v99"/>`, motion:`M198 121c-4-30 9-52 31-63` },
  seated_twist: { scene:"seated", label:"가슴부터 회전", body:`<circle class="pose-head" cx="235" cy="57" r="21"/><path class="pose-figure" d="M218 76l-7 100M216 104l50 20-29 37M216 104l-40 38M211 176l51 12v55M211 176l-34 67"/><path class="pose-ghost" d="M210 34v50"/>`, motion:`M172 79c22-24 58-27 83-7` },
  overhead_reach: { scene:"standing", label:"위로 길게", body:`<circle class="pose-head" cx="210" cy="72" r="20"/><path class="pose-figure" d="M210 94v95M210 113l-31-48-5-40M210 113l31-48 5-40M210 189l-30 64M210 189l30 64"/><path class="pose-accent" d="M170 25h80"/>`, motion:`M174 80V31M246 80V31` },
  side_reach: { scene:"standing", label:"옆구리를 길게", body:`<circle class="pose-head" cx="178" cy="67" r="20"/><path class="pose-figure" d="M192 83c21 28 28 60 20 103M197 105l-31-50-3-39M197 105l43 35M212 186l-27 67M212 186l35 67"/><path class="pose-ghost" d="M210 45v142"/>`, motion:`M250 72c-28-24-53-28-75-14` },
  doorway_chest: { scene:"doorway", label:"한 발 앞으로", body:`<circle class="pose-head" cx="210" cy="55" r="20"/><path class="pose-figure" d="M210 77v108M210 104l-72 5M210 104l72 5M138 109V70M282 109V70M210 185l-48 68M210 185l45 68"/>`, motion:`M210 230h42` },
  seated_pelvic_tilt: { scene:"seated", label:"골반을 앞뒤로", body:`<circle class="pose-head" cx="210" cy="55" r="21"/><path class="pose-figure" d="M210 77c-16 30-15 66 6 99M210 108l-35 39M210 108l35 39M216 176l46 12v55M216 176l-34 67"/><ellipse class="pose-joint" cx="216" cy="176" rx="20" ry="13"/>`, motion:`M185 195c12 18 38 21 56 6` },
  seated_spine_tall: { scene:"seated", label:"몸통을 길게", body:`<circle class="pose-head" cx="210" cy="52" r="21"/><path class="pose-figure" d="M210 74v102M210 106l-34 40M210 106l34 40M210 176l52 12v55M210 176l-34 67"/><path class="pose-ghost" d="M210 30v155"/>`, motion:`M210 82V32` },
  standing_side_lower: { scene:"standing", label:"옆 허리를 늘리기", body:`<circle class="pose-head" cx="181" cy="66" r="20"/><path class="pose-figure" d="M195 83c20 25 27 58 18 103M199 105l-30-47-3-38M199 105l42 38M213 186l-28 67M213 186l33 67"/><ellipse class="pose-joint" cx="213" cy="184" rx="22" ry="10"/>`, motion:`M254 78c-25-23-50-28-72-17` },
  standing_back_extension: { scene:"standing", label:"아주 조금 뒤로", body:`<circle class="pose-head" cx="228" cy="49" r="21"/><path class="pose-figure" d="M217 68c-21 36-19 75 3 115M219 105l-42 46M219 105l42 46M220 183l-31 70M220 183l35 70"/><path class="pose-ghost" d="M210 52v132"/>`, motion:`M195 116c0-25 10-45 28-59` },
  single_knee_chest: { scene:"floor", label:"한쪽 무릎만", body:`<circle class="pose-head" cx="92" cy="215" r="20"/><path class="pose-figure" d="M112 222l116 8M145 226l58-48 40 48M203 178l30 7M145 226l68 13 71 4M153 222l43-28M155 232l45-31"/>`, motion:`M253 160c-25-11-47-2-55 22` },
  bridge: { scene:"floor", label:"엉덩이로 들어 올리기", body:`<circle class="pose-head" cx="88" cy="220" r="20"/><path class="pose-figure" d="M108 224l74-3 63-65 45 86M245 156l45 86M130 223l82-67M127 229l78-62"/><ellipse class="pose-joint" cx="182" cy="219" rx="19" ry="11"/>`, motion:`M182 221V171` }
};

const phaseDefinitions = {
  prepare: { label:"준비", order:0 },
  mobility: { label:"가동성", order:1 },
  activate: { label:"활성화", order:2 },
  release: { label:"이완", order:3 }
};
const phaseAssignments = {
  chin_tuck:"prepare", shoulder_roll:"prepare", shoulder_shrug:"prepare", seated_spine_tall:"prepare",
  neck_turn:"mobility", neck_nod:"mobility", wall_slide:"mobility", seated_extension:"mobility", seated_twist:"mobility", overhead_reach:"mobility", seated_pelvic_tilt:"mobility", standing_back_extension:"mobility",
  neck_isometric:"activate", scapular_squeeze:"activate", bridge:"activate",
  neck_side:"release", levator:"release", cross_arm:"release", eagle_arms:"release", chest_open:"release", side_reach:"release", doorway_chest:"release", standing_side_lower:"release", single_knee_chest:"release"
};
const bilateralExercises = new Set(["neck_side","neck_turn","levator","cross_arm","seated_twist","side_reach","standing_side_lower","single_knee_chest"]);
const painSafeExercises = new Set(["chin_tuck","neck_nod","shoulder_roll","shoulder_shrug","scapular_squeeze","seated_spine_tall","seated_pelvic_tilt","standing_side_lower"]);

let routine = [];

function init() {
  const now = new Date();
  $("#todayLabel").textContent = new Intl.DateTimeFormat("ko-KR", { month:"long", day:"numeric", weekday:"long" }).format(now);
  bindEvents();
  restoreReminders();
  registerServiceWorker();
  startReminderScheduler();
  renderStats();
  renderWeek();
  buildRoutine(false);
  renderExerciseLibrary();
}

function bindEvents() {
  $$("[data-nav]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.nav)));
  $$(".mood").forEach(button => button.addEventListener("click", () => selectMood(button)));
  $$("[data-choice]").forEach(group => group.addEventListener("click", event => {
    const button = event.target.closest("button"); if (!button) return;
    if (group.dataset.multiple === "true") {
      const value = button.dataset.value;
      if (value === "all") {
        $$("button", group).forEach(item => {
          item.classList.toggle("selected", item === button);
          item.setAttribute("aria-pressed", String(item === button));
        });
        state.area = ["all"];
        return;
      }
      if (state.area.includes("all")) {
        const allButton = $('[data-value="all"]', group);
        allButton.classList.remove("selected");
        allButton.setAttribute("aria-pressed", "false");
        state.area = [];
      }
      if (button.classList.contains("selected")) {
        if (state.area.length === 1) { showToast("불편한 부위를 한 곳 이상 선택해 주세요."); return; }
        button.classList.remove("selected");
        state.area = state.area.filter(area => area !== value);
      } else {
        button.classList.add("selected");
        state.area = [...state.area, value];
      }
      button.setAttribute("aria-pressed", String(button.classList.contains("selected")));
      return;
    }
    $$("button", group).forEach(item => item.classList.remove("selected")); button.classList.add("selected");
    state[group.dataset.choice] = group.dataset.choice === "duration" ? Number(button.dataset.value) : button.dataset.value;
  }));
  $("#buildRoutine").addEventListener("click", () => { if (buildRoutine(true)) navigate("routine"); });
  $("#toggleTimer").addEventListener("click", toggleTimer);
  $("#prevExercise").addEventListener("click", () => changeExercise(-1));
  $("#nextExercise").addEventListener("click", () => changeExercise(1));
  $("#painStop").addEventListener("click", () => { stopTimer(); openModal("stopModal"); });
  $$("[data-close]").forEach(button => button.addEventListener("click", () => closeModal(button.dataset.close)));
  $("#safetyContinue").addEventListener("click", safetyContinue);
  [$("#openReminder"), $("#quickReminder")].forEach(button => button.addEventListener("click", () => openModal("reminderDrawer")));
  $("#saveReminders").addEventListener("click", saveReminders);
  $("#completeDone").addEventListener("click", () => { closeModal("completeModal"); navigate("record"); });
  $$(".modal-backdrop,.drawer-backdrop").forEach(backdrop => backdrop.addEventListener("click", event => { if (event.target === backdrop) closeModal(backdrop.id); }));
  document.addEventListener("keydown", event => { if (event.key === "Escape") $$(".open").forEach(el => closeModal(el.id)); });
  $$("[data-library-filter]").forEach(button => button.addEventListener("click", () => {
    $$("[data-library-filter]").forEach(item => item.classList.toggle("selected", item === button));
    renderExerciseLibrary(button.dataset.libraryFilter);
  }));
}

function selectMood(button) {
  $$(".mood").forEach(item => { item.classList.remove("selected"); item.setAttribute("aria-checked","false"); });
  button.classList.add("selected"); button.setAttribute("aria-checked","true"); state.mood = button.dataset.mood;
  renderExerciseLibrary();
  if (state.mood === "pain") openModal("safetyModal");
  else unlockPlanner();
}

function safetyContinue() {
  const checked = $$("#safetyModal input:checked");
  closeModal("safetyModal");
  if (checked.length) {
    checked.forEach(input => input.checked = false);
    openModal("stopModal");
    $("#plannerCard").classList.add("locked");
  } else {
    unlockPlanner();
    showToast("무리하지 않는 부드러운 루틴으로 준비할게요.");
  }
}

function unlockPlanner() {
  $("#plannerCard").classList.remove("locked");
  if (window.innerWidth < 700) setTimeout(() => $("#plannerCard").scrollIntoView({ behavior:"smooth", block:"start" }), 220);
}

function buildRoutine(show = true) {
  const requestedCount = state.duration <= 30 ? 1 : state.duration <= 60 ? 2 : state.duration <= 180 ? 4 : 6;
  const targetAreas = state.area.includes("all") ? ["neck","shoulder","upper","lower"] : state.area;
  let candidates = exerciseBank.filter(item => item.places.includes(state.place) && item.areas.some(area => targetAreas.includes(area)));
  if (state.mood === "pain") candidates = candidates.filter(item => painSafeExercises.has(item.id));
  if (!candidates.length) {
    showToast("현재 상태와 장소에서 안전하게 추천할 동작이 없어요. 쉬거나 보호자에게 알려주세요.");
    return false;
  }
  const count = Math.min(requestedCount, candidates.length);
  const ordered = selectByPhase(candidates, count);
  const baseSeconds = Math.floor(state.duration / count);
  const remainder = state.duration % count;
  routine = ordered.map((item,index) => ({ ...item, seconds:baseSeconds + (index < remainder ? 1 : 0) }));
  state.currentExercise = 0;
  renderRoutine();
  if (show) showToast(`${labels.place[state.place]}에서 할 ${formatDuration(state.duration)} 루틴 ${count}개 동작을 만들었어요.`);
  return true;
}

function renderRoutine() {
  const item = routine[state.currentExercise]; if (!item) return;
  const quiet = ["class","study"].includes(state.place) ? "앉아서 · 조용히" : state.place === "home" ? "앉거나 서서" : "서서 가볍게";
  $("#routineTitle").textContent = `${labels.place[state.place]}에서 ${selectedAreaLabel()} 펴기`;
  $("#routineMeta").textContent = `${formatDuration(state.duration)} · ${quiet} · 도구 없음`;
  $("#exerciseStep").textContent = `${state.currentExercise + 1} / ${routine.length}`;
  $("#routineProgress").style.width = `${state.currentExercise / routine.length * 100}%`;
  $("#totalRemaining").textContent = formatClock(routine.slice(state.currentExercise).reduce((sum, ex) => sum + ex.seconds, 0));
  const visual = item.visual || item.id;
  const guide = visualGuides[visual];
  const detailedSvg = poseDiagrams[item.id] ? createPoseDiagram(item.id) : illustrations[visual].replace("</svg>", `${guide.svg}</svg>`);
  const cues = item.cues || guide.cues;
  $("#exerciseIllustration").innerHTML = `<div class="pose-image">${detailedSvg}</div><div class="visual-cues">${cues.map(cue => `<span>${cue}</span>`).join("")}</div>`;
  $("#exerciseType").textContent = item.type;
  $("#exerciseName").textContent = item.name;
  $("#exercisePhase").textContent = getExercisePhase(item).label;
  $("#exerciseInstruction").textContent = item.instruction;
  $("#exerciseDo").textContent = item.do;
  $("#exerciseDont").textContent = item.dont;
  state.remaining = item.seconds;
  state.currentSide = null;
  renderTimerDisplay(item);
  $("#routineList").innerHTML = routine.map((ex,index) => `<button class="routine-item ${index === state.currentExercise ? "active" : ""}" data-index="${index}"><span>${String(index+1).padStart(2,"0")}</span><div><b>${ex.name}</b><small>${ex.type} · ${formatClock(ex.seconds)}</small></div><i class="phase-mini">${getExercisePhase(ex).label}</i></button>`).join("");
  $$(".routine-item").forEach(button => button.addEventListener("click", () => { stopTimer(); state.currentExercise = Number(button.dataset.index); renderRoutine(); }));
  updatePlayButton();
}

function createPoseDiagram(id) {
  const diagram = poseDiagrams[id];
  return `<svg class="exercise-svg detailed-pose" viewBox="0 0 420 300" role="img" aria-label="${diagram.label} 자세 도해"><defs><marker id="pose-arrow-${id}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#c18b48" stroke="none"/></marker></defs>${poseScenes[diagram.scene]}<g>${diagram.body}</g><path class="pose-motion-line" d="${diagram.motion}" marker-end="url(#pose-arrow-${id})"/><rect class="pose-label-box" x="126" y="264" width="168" height="28" rx="11"/><text class="pose-label-text" x="210" y="283" text-anchor="middle">${diagram.label}</text></svg>`;
}

function renderExerciseLibrary(filter = "all") {
  const library = $("#exerciseLibrary"); if (!library) return;
  const items = filter === "all" ? exerciseBank : exerciseBank.filter(item => item.areas.includes(filter));
  const areaIcon = { neck:"↕", shoulder:"↻", upper:"↗", lower:"⌁" };
  library.innerHTML = items.map(item => {
    const primaryArea = item.areas[0];
    const placeText = item.places.length === 4 ? "모든 장소" : item.places.map(place => labels.place[place]).join(" · ");
    const restricted = state.mood === "pain" && !painSafeExercises.has(item.id);
    return `<button class="library-card ${restricted ? "restricted" : ""}" data-exercise-id="${item.id}" ${restricted ? "aria-disabled=\"true\"" : ""}><span class="library-card-top"><span>${areaIcon[primaryArea]}</span><small>${placeText}</small></span><b>${item.name}</b><small>${getExercisePhase(item).label} · ${item.type}</small><em>${restricted ? "현재 통증 상태에서는 제한" : "30초로 시작 →"}</em></button>`;
  }).join("");
  if ($("#libraryCount")) $("#libraryCount").textContent = `${items.length}개`;
  $$("[data-exercise-id]", library).forEach(button => button.addEventListener("click", () => previewExercise(button.dataset.exerciseId)));
}

function previewExercise(id) {
  const item = exerciseBank.find(exercise => exercise.id === id); if (!item) return;
  if (state.mood === "pain" && !painSafeExercises.has(item.id)) { showToast("‘아픔’ 상태에서는 이 동작을 시작하지 않아요."); return; }
  stopTimer();
  state.duration = 30;
  state.area = [...item.areas];
  state.currentExercise = 0;
  routine = [{ ...item, seconds:30 }];
  renderRoutine();
  navigate("routine");
  $(".exercise-stage").scrollIntoView({ behavior:"smooth", block:"start" });
  showToast(`${item.name} 30초를 준비했어요.`);
}

function shuffleArray(items) {
  const shuffled = [...items];
  for (let index=shuffled.length-1; index>0; index--) {
    const swapIndex = Math.floor(Math.random()*(index+1));
    [shuffled[index],shuffled[swapIndex]] = [shuffled[swapIndex],shuffled[index]];
  }
  return shuffled;
}

function getExercisePhase(item) { return phaseDefinitions[phaseAssignments[item.id] || "release"]; }
function selectByPhase(candidates, count) {
  const groups = Object.keys(phaseDefinitions).map(phase => shuffleArray(candidates.filter(item => (phaseAssignments[item.id] || "release") === phase)));
  const picked = [];
  while (picked.length < count && groups.some(group => group.length)) {
    groups.forEach(group => { if (group.length && picked.length < count) picked.push(group.shift()); });
  }
  return picked.sort((a,b) => getExercisePhase(a).order - getExercisePhase(b).order);
}

function toggleTimer() {
  if (state.running) { stopTimer(); return; }
  state.running = true; updatePlayButton();
  state.timer = setInterval(() => {
    state.remaining -= 1;
    const item = routine[state.currentExercise];
    renderTimerDisplay(item);
    $("#routineProgress").style.width = `${((state.currentExercise + (item.seconds - state.remaining) / item.seconds) / routine.length) * 100}%`;
    if (state.remaining <= 0) { stopTimer(); if (state.currentExercise < routine.length - 1) { state.currentExercise++; renderRoutine(); setTimeout(toggleTimer, 350); } else completeRoutine(); }
  }, 1000);
}

function renderTimerDisplay(item) {
  if (!bilateralExercises.has(item.id)) {
    state.currentSide = null;
    $("#sideLabel").textContent = "양쪽 함께";
    $("#timerValue").textContent = formatClock(state.remaining);
    return;
  }
  const rightSeconds = Math.floor(item.seconds/2);
  const nextSide = state.remaining > rightSeconds ? "왼쪽" : "오른쪽";
  const sideRemaining = nextSide === "왼쪽" ? state.remaining-rightSeconds : state.remaining;
  if (state.currentSide && state.currentSide !== nextSide && state.running) showToast("이제 오른쪽으로 바꿔주세요.");
  state.currentSide = nextSide;
  $("#sideLabel").textContent = `${nextSide} 자세`;
  $("#timerValue").textContent = formatClock(sideRemaining);
}

function stopTimer() { if (state.timer) clearInterval(state.timer); state.timer = null; state.running = false; updatePlayButton(); }
function updatePlayButton() { const button = $("#toggleTimer"); if (!button) return; button.innerHTML = state.running ? "<span>Ⅱ</span> 잠시 멈춤" : "<span>▶</span> 시작"; }
function changeExercise(delta) { stopTimer(); const next = state.currentExercise + delta; if (next < 0) return; if (next >= routine.length) { completeRoutine(); return; } state.currentExercise = next; renderRoutine(); }

function completeRoutine() {
  stopTimer();
  const record = { id:Date.now(), date:new Date().toISOString(), seconds:state.duration, area:selectedAreaLabel(), place:labels.place[state.place] };
  state.records.unshift(record); localStorage.setItem("teumpyeo-records", JSON.stringify(state.records));
  $("#completeSummary").textContent = `${formatDuration(state.duration)} 동안 ${record.area}를 부드럽게 움직였어요.`;
  $("#completeTotal").textContent = formatDuration(state.records.reduce((sum,item) => sum + item.seconds,0));
  renderStats(); renderWeek(); openModal("completeModal");
}

function navigate(name) {
  const target = name === "routine" ? "routinePage" : name === "library" ? "libraryPage" : name === "record" ? "recordPage" : name === "guide" ? "guidePage" : "homePage";
  $$(".page").forEach(page => page.classList.toggle("active", page.id === target));
  $$(".bottom-nav button").forEach(button => button.classList.toggle("active", button.dataset.nav === name));
  if (name === "routine" && !routine.length) buildRoutine(false);
  if (name === "library") renderExerciseLibrary();
  if (name === "record") renderStats();
  document.body.classList.toggle("routine-mode", name === "routine");
  window.scrollTo({ top:0, behavior:"smooth" });
}

function renderStats() {
  const todayKey = dayKey(new Date());
  const todayRecords = state.records.filter(record => dayKey(new Date(record.date)) === todayKey);
  const todaySeconds = todayRecords.reduce((sum,item) => sum + item.seconds,0);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0,0,0,0);
  const weekly = state.records.filter(record => new Date(record.date) >= weekStart);
  const totalSeconds = state.records.reduce((sum,item) => sum + item.seconds,0);
  const streak = calculateStreak();
  $("#dailyCount").textContent = todayRecords.length;
  $("#dailyRing").style.setProperty("--progress", Math.min(100,todayRecords.length/3*100));
  $("#dailyMinutes").textContent = `오늘 ${Math.round(todaySeconds/60)}분 움직였어요`;
  $("#dailyMessage").innerHTML = todayRecords.length ? `오늘 ${todayRecords.length}번<br>잘 움직였어요!` : "첫 스트레칭을<br>시작해볼까요?";
  $("#headerStreak").textContent = `${streak}일`; $("#weeklySessions").textContent = `${weekly.length}회`; $("#totalMinutes").textContent = `${Math.round(totalSeconds/60)}분`; $("#recordStreak").textContent = `${streak}일`;
  const history = $("#historyList");
  history.innerHTML = state.records.length ? state.records.slice(0,8).map(record => `<div class="history-item"><span>↗</span><div><b>${record.place}에서 ${record.area} 펴기</b><small>${formatRecordDate(record.date)}</small></div><small>${formatDuration(record.seconds)}</small></div>`).join("") : `<div class="empty-history">아직 기록이 없어요. 오늘 첫 스트레칭을 시작해보세요.</div>`;
}

function renderWeek() {
  const row = $("#weekRow"); const names = ["일","월","화","수","목","금","토"]; const today = new Date();
  row.innerHTML = Array.from({length:7},(_,i) => { const date = new Date(today); date.setDate(today.getDate() - (6-i)); const done = state.records.some(r => dayKey(new Date(r.date)) === dayKey(date)); return `<div class="day ${done?"done":""} ${i===6?"today":""}"><span>${done?"✓":date.getDate()}</span><small>${names[date.getDay()]}</small></div>`; }).join("");
}

function calculateStreak() {
  const days = new Set(state.records.map(record => dayKey(new Date(record.date)))); let streak = 0; const date = new Date();
  if (!days.has(dayKey(date))) date.setDate(date.getDate()-1);
  while (days.has(dayKey(date))) { streak++; date.setDate(date.getDate()-1); }
  return streak;
}

async function saveReminders() {
  state.reminders = {
    fixed: $('[data-reminder="fixed"]').checked,
    fixedTime: $("#fixedTime").value,
    study: $('[data-reminder="study"]').checked,
    studyInterval: Number($("#studyInterval").value),
    school: $('[data-reminder="school"]').checked,
    schoolTime: $("#schoolTime").value,
    sitting: $('[data-reminder="sitting"]').checked,
    sittingInterval: Number($("#sittingInterval").value),
    quietStart: $("#quietStart").value,
    quietEnd: $("#quietEnd").value,
    anchor: Date.now()
  };
  localStorage.setItem("teumpyeo-reminders",JSON.stringify(state.reminders));
  const active = activeReminderCount();
  const permission = active ? await ensureNotificationPermission() : notificationPermission();
  state.pushConnected = permission === "granted" ? await syncPushSubscription(active) : false;
  restoreReminders();
  closeModal("reminderDrawer");
  showToast(active ? state.pushConnected ? "백그라운드 알림을 연결했어요." : permission === "granted" ? "서버 연결에 실패해 실행 중 알림으로 설정했어요." : "설정은 저장했지만 시스템 알림 권한이 필요해요." : "모든 알림을 껐어요.");
}
function restoreReminders() {
  $$('[data-reminder]').forEach(input => input.checked = Boolean(state.reminders[input.dataset.reminder]));
  $("#fixedTime").value = state.reminders.fixedTime || "18:30";
  $("#studyInterval").value = String(state.reminders.studyInterval || 40);
  $("#schoolTime").value = state.reminders.schoolTime || "10:20";
  $("#sittingInterval").value = String(state.reminders.sittingInterval || 60);
  $("#quietStart").value = state.reminders.quietStart || "22:00";
  $("#quietEnd").value = state.reminders.quietEnd || "07:00";
  updateNotificationStatus();
  updateNextReminder();
}
function activeReminderCount() { return ["fixed","study","school","sitting"].filter(key => state.reminders[key]).length; }
function notificationPermission() { return "Notification" in window ? Notification.permission : "unsupported"; }
async function ensureNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "default") return Notification.requestPermission();
  return Notification.permission;
}
function updateNotificationStatus() {
  const status = $("#notificationStatus");
  const permission = notificationPermission();
  status.className = `notification-status ${state.pushConnected ? "connected" : permission}`;
  status.querySelector("b").textContent = state.pushConnected ? "백그라운드 푸시 연결됨" : permission === "granted" ? "시스템 알림 허용됨 · 저장하면 서버에 연결돼요" : permission === "denied" ? "알림이 차단됨 — 브라우저 설정에서 허용해 주세요" : permission === "unsupported" ? "이 브라우저는 시스템 알림을 지원하지 않아요" : "저장할 때 시스템 알림 권한을 요청해요";
}
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("sw.js");
      if (notificationPermission() === "granted") state.pushConnected = await syncPushSubscription(activeReminderCount() > 0);
      updateNotificationStatus();
    } catch (error) { console.warn("알림 서비스 연결 실패", error); }
  }
}
async function syncPushSubscription(createIfMissing) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription && createIfMissing) {
      const keyResponse = await fetch("/api/push/public-key", { cache:"no-store" });
      if (!keyResponse.ok) return false;
      const { publicKey } = await keyResponse.json();
      subscription = await registration.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:urlBase64ToUint8Array(publicKey) });
    }
    if (!subscription) return false;
    const response = await fetch("/api/push/subscribe", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ subscription:subscription.toJSON(), settings:state.reminders, timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul" })
    });
    return response.ok;
  } catch (error) { console.warn("백그라운드 푸시 연결 실패", error); return false; }
}
function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4-value.length%4)%4);
  const base64 = (value+padding).replace(/-/g,"+").replace(/_/g,"/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(character => character.charCodeAt(0)));
}
function startReminderScheduler() {
  clearInterval(state.reminderTicker);
  checkReminders();
  state.reminderTicker = setInterval(checkReminders, 10000);
}
function checkReminders() {
  if (state.pushConnected) { updateNextReminder(); return; }
  if (!activeReminderCount() || isQuietTime(new Date())) { updateNextReminder(); return; }
  const now = new Date();
  const time = localTime(now);
  const date = dayKey(now);
  if (state.reminders.fixed && time === state.reminders.fixedTime) triggerReminder("스트레칭할 시간이에요", "목과 어깨를 편안하게 움직여볼까요?", `fixed-${date}-${time}`);
  if (state.reminders.school && now.getDay() > 0 && now.getDay() < 6 && time === state.reminders.schoolTime) triggerReminder("쉬는 시간 스트레칭", "자리에서 잠깐 목과 어깨를 풀어주세요.", `school-${date}-${time}`);
  checkIntervalReminder("study", "공부 중 움직일 시간이에요", "같은 자세를 풀고 다시 집중해요.", now);
  checkIntervalReminder("sitting", "오래 앉아 있었어요", "일어나거나 자세를 바꿔 몸을 움직여주세요.", now);
  updateNextReminder();
}
function checkIntervalReminder(type, title, body, now) {
  if (!state.reminders[type]) return;
  const interval = Number(state.reminders[`${type}Interval`]);
  const anchor = Number(state.reminders.anchor || now.getTime());
  const elapsed = Math.floor((now.getTime() - anchor) / 60000);
  if (elapsed > 0 && elapsed % interval === 0) triggerReminder(title, body, `${type}-${dayKey(now)}-${localTime(now)}`);
}
async function triggerReminder(title, body, key, force = false) {
  if (!force && state.deliveredReminderKeys.has(key)) return;
  state.deliveredReminderKeys.add(key);
  if (state.deliveredReminderKeys.size > 100) state.deliveredReminderKeys.clear();
  showToast(`${title} — ${body}`);
  if (notificationPermission() !== "granted") return;
  const options = { body, icon:"icon.svg?v=4", badge:"icon.svg?v=4", tag:key, renotify:true };
  try {
    if ("serviceWorker" in navigator) { const registration = await navigator.serviceWorker.ready; await registration.showNotification(title, options); }
    else new Notification(title, options);
  } catch (error) { console.warn("알림 표시 실패", error); }
}
function isQuietTime(date) {
  const start = timeMinutes(state.reminders.quietStart || "22:00");
  const end = timeMinutes(state.reminders.quietEnd || "07:00");
  const current = date.getHours() * 60 + date.getMinutes();
  return start > end ? current >= start || current < end : current >= start && current < end;
}
function updateNextReminder() {
  if (!activeReminderCount()) { $("#nextReminder").textContent = "아직 설정하지 않았어요"; return; }
  const now = new Date();
  const candidates = [];
  if (state.reminders.fixed) candidates.push(nextTimeDate(state.reminders.fixedTime || "18:30", false));
  if (state.reminders.school) candidates.push(nextTimeDate(state.reminders.schoolTime || "10:20", true));
  ["study","sitting"].forEach(type => {
    if (!state.reminders[type]) return;
    const intervalMs = Number(state.reminders[`${type}Interval`]) * 60000;
    const anchor = Number(state.reminders.anchor || now.getTime());
    candidates.push(new Date(anchor + (Math.floor(Math.max(0,now.getTime()-anchor)/intervalMs)+1)*intervalMs));
  });
  const next = candidates.filter(Boolean).sort((a,b) => a-b)[0];
  $("#nextReminder").textContent = next ? `다음 알림 ${new Intl.DateTimeFormat("ko-KR",{weekday:"short",hour:"2-digit",minute:"2-digit"}).format(next)}` : "알림이 설정됐어요";
}
function nextTimeDate(time, weekdaysOnly) {
  const [hours, minutes] = time.split(":").map(Number); const now = new Date(); const next = new Date(); next.setHours(hours,minutes,0,0);
  if (next <= now) next.setDate(next.getDate()+1);
  if (weekdaysOnly) while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate()+1);
  return next;
}
function localTime(date) { return `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`; }
function timeMinutes(time) { const [hours,minutes] = time.split(":").map(Number); return hours*60+minutes; }
function openModal(id) { const el = document.getElementById(id); el.classList.add("open"); el.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden"; }
function closeModal(id) { const el = document.getElementById(id); if (!el) return; el.classList.remove("open"); el.setAttribute("aria-hidden","true"); if (!$(".open")) document.body.style.overflow=""; }
function showToast(message) { const toast=$("#toast"); toast.textContent=message; toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.classList.remove("show"),2300); }
function formatClock(seconds) { const safe=Math.max(0,seconds); return `${String(Math.floor(safe/60)).padStart(2,"0")}:${String(safe%60).padStart(2,"0")}`; }
function formatDuration(seconds) { return seconds < 60 ? `${seconds}초` : `${Math.round(seconds/60)}분`; }
function dayKey(date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
function formatRecordDate(value) { return new Intl.DateTimeFormat("ko-KR",{month:"long",day:"numeric",weekday:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(value)); }
function selectedAreaLabel() {
  if (state.area.includes("all")) return "목·어깨·등·허리";
  return state.area.map(area => labels.area[area]).join("·");
}

init();
