const translations = {
    en: {
        title: "MBTI Personality Test",
        next: "Next",
        resultTitle: "Your Result",
        questions: [
            {
                question: "You are at a party. What do you do?",
                answers: [
                    { text: "Talk to everyone and make new friends.", type: "E" },
                    { text: "Sit in a corner and observe people.", type: "I" },
                ],
            },
            {
                question: "When you have to make a decision, you rely more on...",
                answers: [
                    { text: "Facts and logic.", type: "S" },
                    { text: "Your intuition and feelings.", type: "N" },
                ],
            },
            {
                question: "You prefer to...",
                answers: [
                    { text: "Plan everything in advance.", type: "J" },
                    { text: "Be spontaneous and flexible.", type: "P" },
                ],
            },
            {
                question: "When you are with your friends, you tend to...",
                answers: [
                    { text: "Do most of the talking.", type: "E" },
                    { text: "Do most of the listening.", type: "I" },
                ],
            },
            {
                question: "You are more interested in...",
                answers: [
                    { text: "What is real and tangible.", type: "S" },
                    { text: "What is possible and imaginable.", type: "N" },
                ],
            },
            {
                question: "You are more of a...",
                answers: [
                    { text: "Thinker.", type: "T" },
                    { text: "Feeler.", type: "F" },
                ],
            },
            {
                question: "You like to...",
                answers: [
                    { text: "Keep your options open.", type: "P" },
                    { text: "Have a clear plan.", type: 'J' },
                ],
            },
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
        questions: [
            {
                question: "파티에 갔을 때 당신은?",
                answers: [
                    { text: "모든 사람과 대화하며 새로운 친구를 만듭니다.", type: "E" },
                    { text: "구석에 앉아 사람들을 관찰합니다.", type: "I" },
                ],
            },
            {
                question: "결정을 내릴 때 더 의존하는 것은?",
                answers: [
                    { text: "사실과 논리", type: "S" },
                    { text: "직감과 감정", type: "N" },
                ],
            },
            {
                question: "당신은...",
                answers: [
                    { text: "미리 모든 것을 계획하는 것을 선호합니다.", type: "J" },
                    { text: "즉흥적이고 유연한 것을 선호합니다.", type: "P" },
                ],
            },
            {
                question: "친구들과 함께 있을 때 당신은?",
                answers: [
                    { text: "주로 말을 많이 하는 편입니다.", type: "E" },
                    { text: "주로 듣는 편입니다.", type: "I" },
                ],
            },
            {
                question: "당신은 다음에 더 관심이 있습니다.",
                answers: [
                    { text: "현실적이고 실질적인 것", type: "S" },
                    { text: "가능성 있고 상상할 수 있는 것", type: "N" },
                ],
            },
            {
                question: "당신은...",
                answers: [
                    { text: "생각하는 사람", type: "T" },
                    { text: "느끼는 사람", type: "F" },
                ],
            },
            {
                question: "당신은...",
                answers: [
                    { text: "선택의 여지를 열어두는 것을 좋아합니다.", type: "P" },
                    { text: "명확한 계획을 세우는 것을 좋아합니다.", type: 'J' },
                ],
            },
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