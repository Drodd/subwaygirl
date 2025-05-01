// 获取DOM元素
const girlBody = document.getElementById('girl-body');
const bgTrain = document.getElementById('bg-train');
const bgCloud1 = document.getElementById('bg-cloud-1');
const bgCloud2 = document.getElementById('bg-cloud-2');
const anchor = document.getElementById('anchor');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const gameOverEl = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');
const angleDisplay = document.getElementById('angle-display');
const scoreDisplay = document.getElementById('score-display');
const finalScoreDisplay = document.getElementById('final-score');
const gameContainer = document.getElementById('game-container');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const loadingScreen = document.getElementById('loading');

// 游戏参数
const MAX_ANGLE = 30; // 最大旋转角度（度）
const CONTROL_POWER = 0.005; // 初始按钮控制的角速度增量
const GRAVITY_FACTOR = 0.00005; // 角度越大，角速度增加越快
const DIFFICULTY_INCREASE_INTERVAL = 1000; // 每隔多少毫秒增加难度
const DIFFICULTY_INCREASE_RATE = 0.000012; // 每次难度增加的幅度
const CONTROL_INCREASE_RATE = 0.000008; // 每次控制能力增加的幅度（约为难度增加的60%-70%）
const DAMPING = 0.995; // 阻尼系数，控制晃动的感觉
const CLOUD_SPEED = 0.05; // 云层移动速度（像素/毫秒）

// 图片资源信息 - 原始尺寸
const BG_ORIGINAL_WIDTH = 934; // 背景图片原始宽度
const BG_ORIGINAL_HEIGHT = 1317; // 背景图片原始高度
const GIRL_ORIGINAL_WIDTH = 218; // 女孩图片原始宽度
const GIRL_ORIGINAL_HEIGHT = 344; // 女孩图片原始高度
const CLOUD_ORIGINAL_WIDTH = 934; // 云层图片原始宽度
const CLOUD_ORIGINAL_HEIGHT = 581; // 云层图片原始高度

// 女孩在背景图中的位置比例 (相对于背景图的原始尺寸)
const GIRL_POSITION_X_RATIO = 0.51; // 女孩在背景图中的水平位置比例（居中）
const GIRL_POSITION_Y_RATIO = 0.62; // 女孩在背景图中的垂直位置比例

// 女孩旋转锚点位置调整
const GIRL_PIVOT_POINT_RATIO = 0.85; // 旋转锚点位置占女孩高度的比例（从上到下）

// 游戏状态
let angle = 0; // 当前角度（度）
let angularVelocity = 0; // 当前角速度（度/帧）
let isGameOver = false;
let isGameStarted = false;
let leftPressed = false;
let rightPressed = false;
let lastTime = 0;
let deltaTime = 0;
let score = 0;
let gameTime = 0;
let currentGravityFactor = GRAVITY_FACTOR;
let currentControlPower = CONTROL_POWER; // 当前控制能力
let highScore = localStorage.getItem('highScore') || 0;
let cloudPositions = [0, 0]; // 两张云层图片的位置
let cloudWidth = 0; // 云层图片的宽度（将在positionElements中计算）

// 等待图片加载完成
let imagesLoaded = 0;
const requiredImages = 3; // 背景、女孩和云层图片

// 初始化游戏
function initGame() {
    // 重置游戏状态
    angle = 0;
    // 随机初始角速度方向（正或负）
    angularVelocity = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.2 + 0.1)/10;
    isGameOver = false;
    isGameStarted = true;
    score = 0;
    gameTime = 0;
    currentGravityFactor = GRAVITY_FACTOR;
    currentControlPower = CONTROL_POWER; // 重置控制能力
    
    // 设置元素位置
    positionElements();
    
    // 隐藏开始和结束界面
    startScreen.style.display = 'none';
    gameOverEl.style.display = 'none';
    
    // 更新显示
    updateDisplay();
    updateScore();
    
    // 重置图片旋转
    girlBody.style.transform = 'rotate(0deg)';
}

// 设置元素位置
function positionElements() {
    const containerWidth = gameContainer.clientWidth;
    const containerHeight = gameContainer.clientHeight;
    
    // 计算背景图片的缩放系数
    let bgScaleFactor;
    const containerAspectRatio = containerWidth / containerHeight;
    const bgAspectRatio = BG_ORIGINAL_WIDTH / BG_ORIGINAL_HEIGHT;
    
    // 计算背景图实际显示的尺寸
    let bgDisplayWidth, bgDisplayHeight;
    
    if (containerAspectRatio > bgAspectRatio) {
        // 如果容器比背景更宽，以宽度为基准缩放
        bgScaleFactor = containerWidth / BG_ORIGINAL_WIDTH;
        bgDisplayWidth = containerWidth;
        bgDisplayHeight = BG_ORIGINAL_HEIGHT * bgScaleFactor;
    } else {
        // 如果容器比背景更高，以高度为基准缩放
        bgScaleFactor = containerHeight / BG_ORIGINAL_HEIGHT;
        bgDisplayWidth = BG_ORIGINAL_WIDTH * bgScaleFactor;
        bgDisplayHeight = containerHeight;
    }
    
    // 计算背景图在容器中的偏移量（居中显示）
    const bgOffsetX = (containerWidth - bgDisplayWidth) / 2;
    const bgOffsetY = (containerHeight - bgDisplayHeight) / 2;
    
    // 调整背景图片尺寸
    bgTrain.style.width = '100%';
    bgTrain.style.height = '100%';
    bgTrain.style.objectFit = 'cover';
    
    // 设置云层背景
    cloudWidth = CLOUD_ORIGINAL_WIDTH * bgScaleFactor;
    const cloudHeight = CLOUD_ORIGINAL_HEIGHT * bgScaleFactor;
    
    // 初始化云层位置（第一张从0开始，第二张紧接着第一张）
    cloudPositions[0] = 0;
    cloudPositions[1] = cloudWidth;
    
    // 设置云层图片的尺寸和位置
    bgCloud1.style.width = `${cloudWidth}px`;
    bgCloud1.style.height = `${cloudHeight}px`;
    bgCloud1.style.left = `${cloudPositions[0]}px`;
    
    bgCloud2.style.width = `${cloudWidth}px`;
    bgCloud2.style.height = `${cloudHeight}px`;
    bgCloud2.style.left = `${cloudPositions[1]}px`;
    
    // 使用背景图片的缩放系数来计算女孩图片的尺寸
    const girlWidth = GIRL_ORIGINAL_WIDTH * bgScaleFactor;
    const girlHeight = GIRL_ORIGINAL_HEIGHT * bgScaleFactor;
    
    girlBody.style.width = `${girlWidth}px`;
    girlBody.style.height = `${girlHeight}px`;
    
    // 根据女孩在背景图中的位置比例计算女孩的位置
    const girlPositionX = bgOffsetX + (GIRL_POSITION_X_RATIO * bgDisplayWidth) - (girlWidth / 2);
    const girlPositionY = bgOffsetY + (GIRL_POSITION_Y_RATIO * bgDisplayHeight) - girlHeight;
    
    girlBody.style.left = `${girlPositionX}px`;
    girlBody.style.top = `${girlPositionY}px`;
    
    // 设置女孩图片的旋转中心点（调整为不在底部）
    const pivotPointY = girlHeight * GIRL_PIVOT_POINT_RATIO; // 旋转点距离图片顶部的距离
    girlBody.style.transformOrigin = `center ${pivotPointY}px`;
    
    // 设置锚点位置（女孩图片旋转中心）
    anchor.style.left = `${girlPositionX + girlWidth / 2}px`;
    anchor.style.top = `${girlPositionY + pivotPointY}px`;
    
    // 控制按钮位置
    const controls = document.getElementById('controls');
    controls.style.bottom = `${containerHeight * 0.1}px`;
    
    // 调整角度指示器的位置和大小（用于调试，通常隐藏）
    const indicators = document.querySelectorAll('.angle-indicator');
    indicators.forEach(indicator => {
        indicator.style.height = `${girlHeight * 0.8}px`;
        indicator.style.top = `${girlPositionY + pivotPointY - girlHeight * 0.8}px`;
        indicator.style.left = `${girlPositionX + girlWidth / 2}px`;
        indicator.style.transformOrigin = 'bottom center';
    });
}

// 游戏循环
function gameLoop(timestamp) {
    if (lastTime === 0) {
        lastTime = timestamp;
    }
    
    deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // 更新云层位置（无论游戏是否开始）
    updateClouds(deltaTime);
    
    if (isGameStarted && !isGameOver) {
        update(deltaTime);
        updateDisplay();
        
        // 增加游戏时间和分数
        gameTime += deltaTime;
        if (gameTime % 100 < deltaTime) { // 每0.1秒增加1分
            score++;
            updateScore();
        }
        
        // 随时间增加难度
        if (gameTime % DIFFICULTY_INCREASE_INTERVAL < deltaTime) {
            increaseDifficulty();
        }
    }
    
    requestAnimationFrame(gameLoop);
}

// 更新云层位置
function updateClouds(dt) {
    // 更新两张云层图片的位置
    cloudPositions[0] -= CLOUD_SPEED * dt;
    cloudPositions[1] -= CLOUD_SPEED * dt;
    
    // 无缝衔接逻辑：当第一张图片完全移出屏幕左侧时，将其移动到第二张图片的右侧
    if (cloudPositions[0] <= -cloudWidth) {
        cloudPositions[0] = cloudPositions[1] + cloudWidth;
    }
    
    // 同样，当第二张图片完全移出屏幕左侧时，将其移动到第一张图片的右侧
    if (cloudPositions[1] <= -cloudWidth) {
        cloudPositions[1] = cloudPositions[0] + cloudWidth;
    }
    
    // 更新云层元素的位置
    bgCloud1.style.left = `${cloudPositions[0]}px`;
    bgCloud2.style.left = `${cloudPositions[1]}px`;
}

// 更新游戏状态
function update(dt) {
    // 根据按钮输入更新角速度
    if (leftPressed) {
        angularVelocity -= currentControlPower * dt;
    }
    if (rightPressed) {
        angularVelocity += currentControlPower * dt;
    }
    
    // 角度越大，自然角速度越大（模拟重力效应）
    angularVelocity += angle * currentGravityFactor * dt;
    
    // 添加阻尼效果，防止快速摆动
    angularVelocity *= DAMPING;
    
    // 更新角度
    angle += angularVelocity;
    
    // 旋转女孩图片
    girlBody.style.transform = `rotate(${angle}deg)`;
    
    // 检查游戏是否结束
    if (Math.abs(angle) > MAX_ANGLE) {
        gameOver();
    }
}

// 更新角度显示
function updateDisplay() {
    angleDisplay.textContent = `${Math.round(angle)}°`;
    
    // 根据角度改变颜色，靠近极限值时变红
    const dangerFactor = Math.abs(angle) / MAX_ANGLE;
    if (dangerFactor > 0.7) {
        const red = Math.floor(255 * (dangerFactor - 0.5) * 2);
        const green = Math.floor(255 * (1 - dangerFactor) * 2);
        angleDisplay.style.color = `rgb(${red}, ${green}, 0)`;
    } else {
        angleDisplay.style.color = 'black';
    }
}

// 更新分数显示
function updateScore() {
    scoreDisplay.textContent = `得分: ${score}`;
}

// 增加游戏难度
function increaseDifficulty() {
    // 增加重力因子（增加难度）
    currentGravityFactor += DIFFICULTY_INCREASE_RATE;
    
    // 同时增加控制能力，但增加幅度略小于难度增加，保持游戏挑战性
    currentControlPower += CONTROL_INCREASE_RATE;
    
    // 可选：在难度增加到一定程度时提高控制能力增加的速率，防止游戏变得不可玩
    if (currentGravityFactor > GRAVITY_FACTOR * 5) {
        currentControlPower += CONTROL_INCREASE_RATE * 0.5; // 额外增加50%的控制能力
    }
}

// 游戏结束
function gameOver() {
    isGameOver = true;
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    
    finalScoreDisplay.textContent = `得分: ${score} (最高分: ${highScore})`;
    gameOverEl.style.display = 'block';
    
    // 振动反馈（如果设备支持）
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
}

// 图片加载事件
function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded >= requiredImages) {
        // 所有图片都加载完成后初始化游戏
        loadingScreen.style.display = 'none';
        init();
    }
}

// 事件监听器
function setupEventListeners() {
    // 开始按钮
    startBtn.addEventListener('click', initGame);
    
    // 图片加载完成事件
    bgTrain.addEventListener('load', imageLoaded);
    girlBody.addEventListener('load', imageLoaded);
    bgCloud1.addEventListener('load', imageLoaded);
    
    // 触摸控制（针对移动设备优化）
    leftBtn.addEventListener('touchstart', (e) => { 
        leftPressed = true; 
        e.preventDefault();
    }, { passive: false });
    
    leftBtn.addEventListener('touchend', (e) => { 
        leftPressed = false; 
        e.preventDefault();
    }, { passive: false });
    
    leftBtn.addEventListener('touchcancel', (e) => { 
        leftPressed = false; 
        e.preventDefault();
    }, { passive: false });
    
    rightBtn.addEventListener('touchstart', (e) => { 
        rightPressed = true; 
        e.preventDefault();
    }, { passive: false });
    
    rightBtn.addEventListener('touchend', (e) => { 
        rightPressed = false; 
        e.preventDefault();
    }, { passive: false });
    
    rightBtn.addEventListener('touchcancel', (e) => { 
        rightPressed = false; 
        e.preventDefault();
    }, { passive: false });
    
    // 鼠标控制（用于桌面测试）
    leftBtn.addEventListener('mousedown', () => { leftPressed = true; });
    leftBtn.addEventListener('mouseup', () => { leftPressed = false; });
    leftBtn.addEventListener('mouseleave', () => { leftPressed = false; });
    
    rightBtn.addEventListener('mousedown', () => { rightPressed = true; });
    rightBtn.addEventListener('mouseup', () => { rightPressed = false; });
    rightBtn.addEventListener('mouseleave', () => { rightPressed = false; });
    
    // 重新开始按钮
    restartBtn.addEventListener('click', initGame);
    
    // 窗口大小调整
    window.addEventListener('resize', () => {
        positionElements();
        if (!isGameStarted) {
            // 如果游戏还没开始，需要重置女孩的角度
            girlBody.style.transform = 'rotate(0deg)';
        }
    });
    
    // 防止整个页面的滚动和缩放
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    // 键盘控制（用于桌面测试）
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            leftPressed = true;
        } else if (e.key === 'ArrowRight') {
            rightPressed = true;
        } else if (e.key === ' ' && !isGameStarted) {
            // 空格键开始游戏
            initGame();
        } else if (e.key === ' ' && isGameOver) {
            // 空格键重新开始游戏
            initGame();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') {
            leftPressed = false;
        } else if (e.key === 'ArrowRight') {
            rightPressed = false;
        }
    });
}

// 初始化
function init() {
    setupEventListeners();
    positionElements();
    // 游戏开始时显示开始界面，而不是直接开始游戏
    isGameStarted = false;
    startScreen.style.display = 'flex';
    
    // 重置女孩的角度
    girlBody.style.transform = 'rotate(0deg)';
    
    requestAnimationFrame(gameLoop);
}

// 检查图片是否已经被缓存
if (bgTrain.complete && girlBody.complete && bgCloud1.complete) {
    // 图片已经加载，直接初始化
    imagesLoaded = requiredImages;
    loadingScreen.style.display = 'none';
    window.addEventListener('load', init);
} else {
    // 等待图片加载
    window.addEventListener('load', function() {
        // 如果页面加载完成但图片还没加载完，进行检查
        if (imagesLoaded < requiredImages) {
            if (bgTrain.complete) imageLoaded();
            if (girlBody.complete) imageLoaded();
            if (bgCloud1.complete) imageLoaded();
        }
    });
} 