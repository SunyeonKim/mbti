const translations = {
    en: {
        title: "MBTI Personality Test",
        next: "Next",
        resultTitle: "Your Result",
        resultPrefix: "Your MBTI type is:",
        darkMode: "Dark Mode",
        lightMode: "Light Mode",
        questions: [
            {
                question: "After a long week, what sounds most recharging?",
                answers: [
                    { text: "Join a lively gathering with new people.", scores: { E: 2 } },
                    { text: "Meet one or two close friends for a calm chat.", scores: { E: 1, I: 1 } },
                    { text: "Stay home alone with a book, game, or movie.", scores: { I: 2 } },
                    { text: "Take a quiet walk and reflect by yourself.", scores: { I: 2 } }
                ]
            },
            {
                question: "When making an important decision, what leads first?",
                answers: [
                    { text: "Data, evidence, and consistency.", scores: { T: 2 } },
                    { text: "How the decision affects people emotionally.", scores: { F: 2 } },
                    { text: "A balanced mix of fairness and logic.", scores: { T: 1, F: 1 } },
                    { text: "My values and what feels right long-term.", scores: { F: 2 } }
                ]
            },
            {
                question: "How do you usually prepare for travel?",
                answers: [
                    { text: "Detailed itinerary, booking, and checklist.", scores: { J: 2 } },
                    { text: "Core plan first, then flexible choices on the way.", scores: { J: 1, P: 1 } },
                    { text: "Decide late and improvise as things unfold.", scores: { P: 2 } },
                    { text: "Pick only destination and mood, then wander.", scores: { P: 2 } }
                ]
            },
            {
                question: "When learning something new, what works best for you?",
                answers: [
                    { text: "Step-by-step examples and practical drills.", scores: { S: 2 } },
                    { text: "Big-picture concepts before details.", scores: { N: 2 } },
                    { text: "A little theory, then immediate hands-on practice.", scores: { S: 1, N: 1 } },
                    { text: "Connecting the idea to future possibilities.", scores: { N: 2 } }
                ]
            },
            {
                question: "In a team conflict, your first instinct is to...",
                answers: [
                    { text: "Clarify facts and separate emotion from issue.", scores: { T: 2 } },
                    { text: "Help everyone feel heard before solving.", scores: { F: 2 } },
                    { text: "Find a workable compromise quickly.", scores: { T: 1, F: 1 } },
                    { text: "Privately check in with each person first.", scores: { F: 2 } }
                ]
            },
            {
                question: "At an event where you know no one, you usually...",
                answers: [
                    { text: "Start conversations right away.", scores: { E: 2 } },
                    { text: "Wait, observe, then talk to a few people.", scores: { E: 1, I: 1 } },
                    { text: "Stick with one familiar person if possible.", scores: { I: 2 } },
                    { text: "Leave early if the vibe drains you.", scores: { I: 2 } }
                ]
            },
            {
                question: "For a new task with vague instructions, you prefer...",
                answers: [
                    { text: "Clear process, examples, and known standards.", scores: { S: 2 } },
                    { text: "Room to experiment with novel ideas.", scores: { N: 2 } },
                    { text: "Start from a proven baseline, then improve.", scores: { S: 1, N: 1 } },
                    { text: "Challenge assumptions and redesign it.", scores: { N: 2 } }
                ]
            },
            {
                question: "When juggling many deadlines, you tend to...",
                answers: [
                    { text: "Prioritize, schedule, and execute in order.", scores: { J: 2 } },
                    { text: "Track key dates but stay adaptive.", scores: { J: 1, P: 1 } },
                    { text: "Work in bursts based on energy and urgency.", scores: { P: 2 } },
                    { text: "Do your best under last-minute pressure.", scores: { P: 2 } }
                ]
            },
            {
                question: "A close friend is upset. You most likely...",
                answers: [
                    { text: "Offer practical steps to fix the issue.", scores: { T: 2 } },
                    { text: "Listen deeply and validate feelings first.", scores: { F: 2 } },
                    { text: "Ask what they need: advice or empathy.", scores: { T: 1, F: 1 } },
                    { text: "Stay present until they feel emotionally safe.", scores: { F: 2 } }
                ]
            },
            {
                question: "In brainstorming, you naturally focus on...",
                answers: [
                    { text: "What already works in real situations.", scores: { S: 2 } },
                    { text: "Patterns, meaning, and unseen potential.", scores: { N: 2 } },
                    { text: "One practical idea plus one bold concept.", scores: { S: 1, N: 1 } },
                    { text: "Future scenarios and unconventional options.", scores: { N: 2 } }
                ]
            },
            {
                question: "You get a free evening unexpectedly. You choose to...",
                answers: [
                    { text: "Call friends and make spontaneous plans.", scores: { E: 2 } },
                    { text: "Do a casual social activity nearby.", scores: { E: 1, I: 1 } },
                    { text: "Enjoy solo time and recharge quietly.", scores: { I: 2 } },
                    { text: "Dive into a personal hobby alone.", scores: { I: 2 } }
                ]
            },
            {
                question: "At the start of a project, your default mode is...",
                answers: [
                    { text: "Define scope, milestones, and responsibilities.", scores: { J: 2 } },
                    { text: "Set a direction, then iterate as you go.", scores: { J: 1, P: 1 } },
                    { text: "Start quickly and shape the plan later.", scores: { P: 2 } },
                    { text: "Keep options open until the last useful moment.", scores: { P: 2 } }
                ]
            }
        ],
        mbtiDescriptions: {
            "ISTJ": "The Inspector: Reserved and practical, they tend to be responsible, organized, and dependable.",
            "ISFJ": "The Protector: Warm-hearted and responsible, they are devoted to their loved ones and are protective of their feelings.",
            "INFJ": "The Advocate: Insightful and idealistic, they tend to be creative, gentle, and caring.",
            "INTJ": "The Architect: Strategic and logical, they are driven by their own original ideas to achieve improvements.",
            "ISTP": "The Crafter: Observant and practical, they are hands-on learners who enjoy figuring out how things work.",
            "ISFP": "The Artist: Charming and sensitive, they are spontaneous and enjoy living in the moment.",
            "INFP": "The Mediator: Idealistic and imaginative, they are guided by their own core values and beliefs.",
            "INTP": "The Thinker: Innovative and logical, they are fascinated by patterns and enjoy exploring abstract ideas.",
            "ESTP": "The Dynamo: Energetic and action-oriented, they are hands-on and enjoy living in the moment.",
            "ESFP": "The Performer: Enthusiastic and spontaneous, they are the life of the party and enjoy being the center of attention.",
            "ENFP": "The Champion: Charismatic and energetic, they are creative, sociable, and enjoy exploring new possibilities.",
            "ENTP": "The Debater: Quick-witted and clever, they enjoy intellectual challenges and are stimulated by new ideas.",
            "ESTJ": "The Supervisor: Hardworking and traditional, they are organized and enjoy taking charge of situations.",
            "ESFJ": "The Caregiver: Sociable and outgoing, they are attuned to the needs of others and are eager to help.",
            "ENFJ": "The Giver: Charismatic and inspiring, they are natural leaders who are passionate about helping others.",
            "ENTJ": "The Commander: Bold and decisive, they are natural leaders who enjoy taking charge and solving problems."
        }
    },
    ko: {
        title: "MBTI 성격 검사",
        next: "다음",
        resultTitle: "결과",
        resultPrefix: "당신의 MBTI 유형:",
        darkMode: "다크 모드",
        lightMode: "화이트 모드",
        questions: [
            {
                question: "바쁜 한 주를 보낸 뒤, 가장 회복되는 시간은?",
                answers: [
                    { text: "새로운 사람들과 활기 있게 어울린다.", scores: { E: 2 } },
                    { text: "가까운 사람 1~2명과 차분히 대화한다.", scores: { E: 1, I: 1 } },
                    { text: "집에서 혼자 쉬며 취미를 즐긴다.", scores: { I: 2 } },
                    { text: "조용히 산책하며 생각을 정리한다.", scores: { I: 2 } }
                ]
            },
            {
                question: "중요한 결정을 내릴 때 가장 먼저 보는 것은?",
                answers: [
                    { text: "근거, 데이터, 일관성", scores: { T: 2 } },
                    { text: "사람에게 미칠 감정적 영향", scores: { F: 2 } },
                    { text: "논리와 배려의 균형", scores: { T: 1, F: 1 } },
                    { text: "내 가치관과 마음의 방향", scores: { F: 2 } }
                ]
            },
            {
                question: "여행을 준비할 때 보통 어떻게 하나요?",
                answers: [
                    { text: "일정, 예약, 체크리스트를 상세히 만든다.", scores: { J: 2 } },
                    { text: "큰 틀만 정하고 현지에서 유연하게 조정한다.", scores: { J: 1, P: 1 } },
                    { text: "막판에 정하고 즉흥적으로 움직인다.", scores: { P: 2 } },
                    { text: "목적지만 정하고 흐름대로 다닌다.", scores: { P: 2 } }
                ]
            },
            {
                question: "새로운 것을 배울 때 더 잘 맞는 방식은?",
                answers: [
                    { text: "구체적 예시와 단계별 실습", scores: { S: 2 } },
                    { text: "전체 개념을 먼저 이해한 뒤 세부 확인", scores: { N: 2 } },
                    { text: "이론 조금 + 바로 실전 적용", scores: { S: 1, N: 1 } },
                    { text: "미래 활용 가능성과 연결해서 학습", scores: { N: 2 } }
                ]
            },
            {
                question: "팀 내 갈등이 생기면 먼저 하는 행동은?",
                answers: [
                    { text: "사실관계를 정리하고 쟁점을 분리한다.", scores: { T: 2 } },
                    { text: "각자의 감정을 충분히 듣는다.", scores: { F: 2 } },
                    { text: "현실적인 타협안을 빠르게 찾는다.", scores: { T: 1, F: 1 } },
                    { text: "개별적으로 먼저 공감 대화를 한다.", scores: { F: 2 } }
                ]
            },
            {
                question: "아는 사람이 거의 없는 모임에 가면 보통?",
                answers: [
                    { text: "먼저 말을 걸며 분위기를 만든다.", scores: { E: 2 } },
                    { text: "분위기를 보다가 몇 명과 대화한다.", scores: { E: 1, I: 1 } },
                    { text: "익숙한 사람 옆에서 천천히 적응한다.", scores: { I: 2 } },
                    { text: "에너지가 빨리 소모되면 일찍 나온다.", scores: { I: 2 } }
                ]
            },
            {
                question: "설명이 애매한 새 업무를 받으면 선호하는 방식은?",
                answers: [
                    { text: "명확한 절차와 참고 사례부터 찾는다.", scores: { S: 2 } },
                    { text: "새로운 방법을 실험하며 방향을 만든다.", scores: { N: 2 } },
                    { text: "기존 방식으로 시작하고 점진 개선한다.", scores: { S: 1, N: 1 } },
                    { text: "전제를 의심하고 구조를 새로 설계한다.", scores: { N: 2 } }
                ]
            },
            {
                question: "마감이 여러 개 겹치면 보통 어떻게 처리하나요?",
                answers: [
                    { text: "우선순위와 일정표를 만들어 순서대로 진행한다.", scores: { J: 2 } },
                    { text: "핵심 일정만 잡고 상황에 맞게 조정한다.", scores: { J: 1, P: 1 } },
                    { text: "에너지와 긴급도에 따라 몰입해서 처리한다.", scores: { P: 2 } },
                    { text: "막판 집중력으로 해결하는 편이다.", scores: { P: 2 } }
                ]
            },
            {
                question: "친한 친구가 힘들어할 때 당신은?",
                answers: [
                    { text: "문제를 해결할 실질적 방법을 제안한다.", scores: { T: 2 } },
                    { text: "먼저 충분히 듣고 감정을 공감한다.", scores: { F: 2 } },
                    { text: "조언이 필요한지, 공감이 필요한지 먼저 묻는다.", scores: { T: 1, F: 1 } },
                    { text: "마음이 안정될 때까지 곁을 지킨다.", scores: { F: 2 } }
                ]
            },
            {
                question: "아이디어 회의에서 자연스럽게 집중하는 것은?",
                answers: [
                    { text: "이미 검증된 현실적인 방안", scores: { S: 2 } },
                    { text: "패턴, 의미, 잠재 가능성", scores: { N: 2 } },
                    { text: "실행안 1개 + 실험안 1개를 같이 본다.", scores: { S: 1, N: 1 } },
                    { text: "미래 시나리오와 파격적 대안", scores: { N: 2 } }
                ]
            },
            {
                question: "갑자기 저녁 시간이 비면 가장 하고 싶은 것은?",
                answers: [
                    { text: "사람들에게 연락해 즉석 약속을 잡는다.", scores: { E: 2 } },
                    { text: "가벼운 소셜 활동을 짧게 즐긴다.", scores: { E: 1, I: 1 } },
                    { text: "혼자 쉬며 에너지를 충전한다.", scores: { I: 2 } },
                    { text: "개인 취미에 깊게 몰입한다.", scores: { I: 2 } }
                ]
            },
            {
                question: "프로젝트 시작 단계에서 기본 스타일은?",
                answers: [
                    { text: "범위, 일정, 역할을 먼저 명확히 정한다.", scores: { J: 2 } },
                    { text: "큰 방향을 잡고 진행하며 다듬는다.", scores: { J: 1, P: 1 } },
                    { text: "일단 시작하고 계획은 진행하며 맞춘다.", scores: { P: 2 } },
                    { text: "가능성을 열어두고 마지막에 결정한다.", scores: { P: 2 } }
                ]
            }
        ],
        mbtiDescriptions: {
            "ISTJ": "검사관: 내성적이고 실용적이며 책임감 있고 조직적이며 신뢰할 수 있는 경향이 있습니다.",
            "ISFJ": "보호자: 마음이 따뜻하고 책임감이 강하며 사랑하는 사람들에게 헌신하고 감정을 보호합니다.",
            "INFJ": "옹호자: 통찰력 있고 이상주의적이며 창의적이고 온화하며 배려심이 많은 경향이 있습니다.",
            "INTJ": "건축가: 전략적이고 논리적이며 개선을 달성하기 위해 자신의 독창적인 아이디어에 의해 움직입니다.",
            "ISTP": "장인: 관찰력이 뛰어나고 실용적이며, 직접 해보는 학습자로서 사물이 어떻게 작동하는지 알아내는 것을 즐깁니다.",
            "ISFP": "예술가: 매력적이고 민감하며 즉흥적이며 순간을 즐깁니다.",
            "INFP": "중재자: 이상주의적이고 상상력이 풍부하며 자신의 핵심 가치와 신념에 따라 인도됩니다.",
            "INTP": "사상가: 혁신적이고 논리적이며 패턴에 매료되고 추상적인 아이디어를 탐구하는 것을 즐깁니다.",
            "ESTP": "디나모: 활기차고 행동 지향적이며 직접 해보고 순간을 즐깁니다.",
            "ESFP": "공연자: 열정적이고 즉흥적이며 파티의 삶이며 주목받는 것을 즐깁니다.",
            "ENFP": "챔피언: 카리스마 있고 활기차고 창의적이고 사교적이며 새로운 가능성을 탐구하는 것을 즐깁니다.",
            "ENTP": "토론가: 재치 있고 영리하며 지적인 도전을 즐기고 새로운 아이디어에 자극을 받습니다.",
            "ESTJ": "감독관: 열심히 일하고 전통적이며 조직적이며 상황을 책임지는 것을 즐깁니다.",
            "ESFJ": "간병인: 사교적이고 외향적이며 다른 사람의 필요에 맞추고 기꺼이 돕습니다.",
            "ENFJ": "주는 사람: 카리스마 있고 영감을 주며 다른 사람을 돕는 데 열정적인 타고난 리더입니다.",
            "ENTJ": "사령관: 대담하고 결단력 있는 타고난 리더로서 책임지고 문제를 해결하는 것을 즐깁니다."
        }
    }
};
