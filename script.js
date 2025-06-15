// 메뉴 목록 (localStorage 우선)
function getMenuItems() {
    const saved = localStorage.getItem('rouletteMenuItems');
    if (saved) {
        try {
            const arr = JSON.parse(saved);
            if (Array.isArray(arr) && arr.every(item => item.name && typeof item.percent === 'number')) {
                return arr;
            }
        } catch (e) {}
    }
    // 기본값
    return [
        { name: '삼겹살', percent: 30 },
        { name: '오리고기', percent: 10 },
        { name: '비빔밥', percent: 10 },
        { name: '제육볶음', percent: 20 },
        { name: '돈까스', percent: 10 }
    ];
}

// 파이차트 조각 그리기 함수
function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", cx, cy,
        "L", start.x, start.y,
        "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
    ].join(" ");
}
function polarToCartesian(cx, cy, r, angle) {
    const rad = (angle-90) * Math.PI / 180.0;
    return {
        x: cx + (r * Math.cos(rad)),
        y: cy + (r * Math.sin(rad))
    };
}

// 룰렛 초기화 (SVG 파이차트, percent 기반)
function initializeRoulette() {
    const wheel = document.querySelector('.wheel');
    wheel.innerHTML = '';
    const cx = 200, cy = 200, r = 180;
    // percent 합이 100이 아니면 '아무거나' 추가
    let items = getMenuItems();
    const totalPercent = items.reduce((sum, item) => sum + item.percent, 0);
    if (totalPercent < 100) {
        items = [...items, { name: '아무거나', percent: 100 - totalPercent }];
    }
    let currentAngle = 0;

    items.forEach((item, i) => {
        const angle = item.percent * 3.6; // percent -> degree
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        // 파이 조각
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', describeArc(cx, cy, r, startAngle, endAngle));
        path.setAttribute('fill', `hsl(${i * (360 / items.length)}, 70%, 50%)`);
        wheel.appendChild(path);
        // 텍스트 위치 계산
        const midAngle = startAngle + angle / 2;
        const textRadius = r * 0.72;
        const textPos = polarToCartesian(cx, cy, textRadius, midAngle);
        // 텍스트
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', textPos.x);
        text.setAttribute('y', textPos.y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '20');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('transform', `rotate(${midAngle},${textPos.x},${textPos.y})`);
        text.textContent = item.name;
        wheel.appendChild(text);
        currentAngle += angle;
    });
    // spinRoulette에서 사용할 수 있도록 전역에 저장
    window._rouletteItems = items;
}

// 룰렛 회전 애니메이션 (percent 기반 선택)
function spinRoulette() {
    const wheel = document.querySelector('.wheel');
    const spinButton = document.getElementById('spinButton');
    const popup = document.getElementById('resultPopup');
    const selectedMenu = document.getElementById('selectedMenu');
    
    spinButton.disabled = true;
    const rotations = 5 + Math.random() * 5;
    const targetAngle = rotations * 360 + Math.random() * 360;
    gsap.to(wheel, {
        rotation: targetAngle,
        duration: 5,
        ease: "power2.out",
        onComplete: () => {
            const finalRotation = targetAngle % 360;
            // 0도(위쪽) 기준으로 시계방향으로 누적 각도 계산
            let accAngle = 0;
            let selected = null;
            const items = window._rouletteItems || getMenuItems();
            for (let i = 0; i < items.length; i++) {
                const angle = items[i].percent * 3.6;
                if (360 - finalRotation >= accAngle && 360 - finalRotation < accAngle + angle) {
                    selected = items[i].name;
                    break;
                }
                accAngle += angle;
            }
            selectedMenu.textContent = selected || items[items.length-1].name;
            popup.classList.add('active');
            // 폭죽 효과
            if (window.confetti) {
                confetti({
                    particleCount: 120,
                    spread: 90,
                    origin: { y: 0.6 }
                });
            }
            spinButton.disabled = false;
        }
    });
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    initializeRoulette();
    const spinButton = document.getElementById('spinButton');
    const closePopup = document.getElementById('closePopup');
    const popup = document.getElementById('resultPopup');
    const editMenuButton = document.getElementById('editMenuButton');
    const backToRoulette = document.getElementById('backToRoulette');
    const rouletteScreen = document.getElementById('rouletteScreen');
    const editScreen = document.getElementById('editScreen');

    spinButton.addEventListener('click', spinRoulette);
    closePopup.addEventListener('click', () => {
        popup.classList.remove('active');
    });
    if (editMenuButton && backToRoulette) {
        editMenuButton.addEventListener('click', () => {
            rouletteScreen.style.display = 'none';
            editScreen.style.display = 'block';
        });
        backToRoulette.addEventListener('click', () => {
            editScreen.style.display = 'none';
            rouletteScreen.style.display = 'block';
        });
    }
}); 