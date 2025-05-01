// 获取DOM元素
const girlBody = document.getElementById('girl-body');
const bgTrain = document.getElementById('bg-train');
const bgCloud1 = document.getElementById('bg-cloud-1');
const bgCloud2 = document.getElementById('bg-cloud-2');
const anchor = document.getElementById('anchor');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const gameOverEl = document.getElementById('game-over');
const gameOverOverlay = document.getElementById('game-over-overlay');
const restartBtn = document.getElementById('restart-btn');
const angleDisplay = document.getElementById('angle-display');
const scoreDisplay = document.getElementById('score-display');
const finalScoreDisplay = document.getElementById('final-score');
const gameContainer = document.getElementById('game-container');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const loadingScreen = document.getElementById('loading');
const gameoverImage = document.querySelector('#gameover-image img');

// 游戏参数
const MAX_ANGLE = 30; // 最大旋转角度（度）
const CONTROL_POWER = 0.005; // 初始按钮控制的角速度增量
const GRAVITY_FACTOR = 0.00005; // 角度越大，角速度增加越快
const DIFFICULTY_INCREASE_INTERVAL = 5000; // 每隔多少毫秒增加难度
const DIFFICULTY_INCREASE_RATE = 0.000012; // 每次难度增加的幅度
const CONTROL_INCREASE_RATE = 0.0000012; // 每次控制能力增加的幅度
const DAMPING = 0.995; // 阻尼系数，控制晃动的感觉
const CLOUD_SPEED = 0.05; // 云层移动速度（像素/毫秒）
// 地铁车厢震动参数
const TRAIN_BOUNCE_AMPLITUDE = 2; // 震动幅度（像素）
const TRAIN_BOUNCE_SPEED = 0.0015; // 震动速度（弧度/毫秒）
const TRAIN_BOUNCE_SECONDARY_AMPLITUDE = 0.7; // 次要震动幅度（像素）
const TRAIN_BOUNCE_SECONDARY_SPEED = 0.005; // 次要震动速度（弧度/毫秒）

// 图片资源信息 - 原始尺寸
const BG_ORIGINAL_WIDTH = 934; // 背景图片原始宽度
const BG_ORIGINAL_HEIGHT = 1317; // 背景图片原始高度
const GIRL_ORIGINAL_WIDTH = 218; // 女孩图片原始宽度
const GIRL_ORIGINAL_HEIGHT = 344; // 女孩图片原始高度
const CLOUD_ORIGINAL_WIDTH = 934; // 云层图片原始宽度
const CLOUD_ORIGINAL_HEIGHT = 581; // 云层图片原始高度

// 女孩在背景图中的位置比例 (相对于背景图的原始尺寸)
const GIRL_POSITION_X_RATIO = 0.51; // 女孩在背景图中的水平位置比例（居中）
const GIRL_POSITION_Y_RATIO = 0.63; // 女孩在背景图中的垂直位置比例

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
let timeElapsed = 0; // 游戏时间（毫秒）
let gameTime = 0;
let currentGravityFactor = GRAVITY_FACTOR;
let currentControlPower = CONTROL_POWER; // 当前控制能力
let highScore = localStorage.getItem('highScore') || 0;
let cloudPositions = [0, 0]; // 两张云层图片的位置
let cloudWidth = 0; // 云层图片的宽度（将在positionElements中计算）
let trainBouncePhase = 0; // 地铁车厢震动的相位
let trainSecondaryBouncePhase = 0; // 次要震动相位
let randomBounceTimer = 0; // 随机额外震动计时器
let randomBounceOffset = 0; // 随机额外震动偏移量

// 等待图片加载完成
let imagesLoaded = 0;
const requiredImages = 3; // 背景、女孩和云层图片

// 结局图片配置
const gameoverImages = {
    left: [
        'img/img_gameover_left1.png',
        'img/img_gameover_left2.png'
    ],
    right: [
        'img/img_gameover_right1.png',
        'img/img_gameover_righ2.png'
    ]
};

// 随机获取数组中的一个元素
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// 格式化时间为 分:秒.毫秒
function formatTime(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = Math.floor((milliseconds % 1000/100) );
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(1, '0')}`;
}

// 初始化游戏
function initGame() {
    // 重置游戏状态
    angle = 0;
    // 随机初始角速度方向（正或负）
    angularVelocity = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.2 + 0.1)/10;
    isGameOver = false;
    isGameStarted = true;
    timeElapsed = 0;
    gameTime = 0;
    currentGravityFactor = GRAVITY_FACTOR;
    currentControlPower = CONTROL_POWER; // 重置控制能力
    trainBouncePhase = 0; // 重置震动相位
    trainSecondaryBouncePhase = 0; // 重置次要震动相位
    randomBounceTimer = 0; // 重置随机震动计时器
    randomBounceOffset = 0; // 重置随机震动偏移量
    
    // 播放背景音乐
    const bgm = document.getElementById('bgm');
    bgm.volume = 0.5; // 设置音量为50%
    bgm.play().catch(error => {
        console.log('BGM自动播放失败:', error);
        // 在移动设备上可能需要用户交互才能播放音频
    });
    
    // 设置元素位置
    positionElements();
    
    // 隐藏开始和结束界面
    startScreen.style.display = 'none';
    gameOverEl.style.display = 'none';
    gameOverOverlay.style.display = 'none';
    gameOverOverlay.classList.remove('show');
    
    // 更新显示
    updateDisplay();
    updateScore();
    
    // 重置图片旋转和位置
    const mainOffset = Math.sin(trainBouncePhase) * TRAIN_BOUNCE_AMPLITUDE;
    const secondaryOffset = Math.sin(trainSecondaryBouncePhase) * TRAIN_BOUNCE_SECONDARY_AMPLITUDE;
    const totalOffset = mainOffset + secondaryOffset + randomBounceOffset;
    girlBody.style.transform = `translateY(${totalOffset}px) rotate(0deg)`;
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
        bgScaleFactor = containerWidth / BG_ORIGINAL_WIDTH * 1.05; // 设置为屏幕宽度的1.05倍，预留震动空间
        bgDisplayWidth = containerWidth * 1.05;
        bgDisplayHeight = BG_ORIGINAL_HEIGHT * bgScaleFactor;
    } else {
        // 如果容器比背景更高，以高度为基准缩放
        bgScaleFactor = containerHeight / BG_ORIGINAL_HEIGHT;
        bgDisplayWidth = BG_ORIGINAL_WIDTH * bgScaleFactor * 1.05; // 设置为宽度的1.05倍，预留震动空间
        bgDisplayHeight = containerHeight;
    }
    
    // 计算背景图在容器中的偏移量（居中显示）
    const bgOffsetX = (containerWidth - bgDisplayWidth) / 2;
    const bgOffsetY = (containerHeight - bgDisplayHeight) / 2;
    
    // 调整背景图片尺寸
    bgTrain.style.width = '105%'; // 设置为105%以便有空间进行震动
    bgTrain.style.height = '105%';
    bgTrain.style.objectFit = 'cover';
    bgTrain.style.position = 'absolute';
    bgTrain.style.left = '-2.5%'; // 将图片向左偏移2.5%，以便震动时不会露出背景
    bgTrain.style.top = '-2.5%';  // 将图片向上偏移2.5%，以便震动时不会露出背景
    
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
    const girlWidth = GIRL_ORIGINAL_WIDTH * bgScaleFactor*1.05;
    const girlHeight = GIRL_ORIGINAL_HEIGHT * bgScaleFactor*1.05;
    
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
    
    // 更新地铁车厢震动效果（无论游戏是否开始）
    updateTrainBounce(deltaTime);
    
    if (isGameStarted && !isGameOver) {
        update(deltaTime);
        updateDisplay();
        
        // 增加游戏时间
        gameTime += deltaTime;
        // 累加游戏计时
        timeElapsed += deltaTime;
        // 每100毫秒更新一次显示，减少性能消耗
        if (gameTime % 100 < deltaTime) {
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

// 更新地铁车厢震动效果
function updateTrainBounce(dt) {
    // 更新主要震动相位
    trainBouncePhase += TRAIN_BOUNCE_SPEED * dt;
    
    // 更新次要震动相位
    trainSecondaryBouncePhase += TRAIN_BOUNCE_SECONDARY_SPEED * dt;
    
    // 主要低频震动 + 次要高频小幅度震动，模拟真实地铁运行效果
    const mainOffset = Math.sin(trainBouncePhase) * TRAIN_BOUNCE_AMPLITUDE;
    const secondaryOffset = Math.sin(trainSecondaryBouncePhase) * TRAIN_BOUNCE_SECONDARY_AMPLITUDE;
    
    // 随机震动效果（模拟地铁轨道接缝或不平整路段）
    randomBounceTimer -= dt;
    if (randomBounceTimer <= 0) {
        // 每隔 2-5 秒生成一次随机震动
        randomBounceTimer = Math.random() * 3000 + 2000;
        randomBounceOffset = (Math.random() * 2 - 1) * 3; // -3 到 3 的随机值
    }
    
    // 若有随机震动，随时间逐渐衰减
    if (Math.abs(randomBounceOffset) > 0.1) {
        randomBounceOffset *= 0.95; // 震动衰减
    } else {
        randomBounceOffset = 0;
    }
    
    // 计算总的偏移量
    const totalOffset = mainOffset + secondaryOffset + randomBounceOffset;
    
    // 应用偏移量到背景图片
    bgTrain.style.transform = `translateY(${totalOffset}px)`;
    
    // 同步应用偏移量到女孩图片（使其与地铁背景同步震动）
    if (!isGameStarted || isGameOver) {
        // 如果游戏未开始或已结束，只应用translateY变换
        girlBody.style.transform = `translateY(${totalOffset}px)`;
    } else {
        // 如果游戏正在进行中，需要同时保持旋转角度和应用震动效果
        girlBody.style.transform = `translateY(${totalOffset}px) rotate(${angle}deg)`;
    }
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
    
    // 获取当前震动偏移量（确保与updateTrainBounce中计算的一致）
    const mainOffset = Math.sin(trainBouncePhase) * TRAIN_BOUNCE_AMPLITUDE;
    const secondaryOffset = Math.sin(trainSecondaryBouncePhase) * TRAIN_BOUNCE_SECONDARY_AMPLITUDE;
    const totalOffset = mainOffset + secondaryOffset + randomBounceOffset;
    
    // 旋转女孩图片（同时保持震动效果）
    girlBody.style.transform = `translateY(${totalOffset}px) rotate(${angle}deg)`;
    
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
    scoreDisplay.textContent = formatTime(timeElapsed);
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
    if (isGameOver) return;
    
    isGameOver = true;
    
    // 暂停背景音乐
    const bgm = document.getElementById('bgm');
    bgm.pause();
    
    // 更新分数
    const formattedTime = formatTime(gameTime);
    finalScoreDisplay.textContent = `她睡了 ${formattedTime}`;
    
    // 更新最高分数
    if (gameTime > highScore) {
        highScore = gameTime;
        localStorage.setItem('highScore', highScore);
    }
    
    // 显示最高分数
    const formattedHighScore = formatTime(highScore);
    document.getElementById('best-score').textContent = `历史最佳: ${formattedHighScore}`;
    
    // 根据倾斜角度选择结局图片
    const imageList = angle < 0 ? gameoverImages.left : gameoverImages.right;
    const selectedImage = getRandomElement(imageList);
    
    // 获取图片容器元素
    const gameoverImageContainer = document.getElementById('gameover-image');
    
    // 预设图片容器的最小高度，防止布局跳动
    gameoverImageContainer.style.minHeight = '150px';
    gameoverImageContainer.style.display = 'block';
    
    // 设置图片加载错误处理
    gameoverImage.onerror = function() {
        console.error('结局图片加载失败:', selectedImage);
        // 隐藏图片容器
        gameoverImageContainer.style.display = 'none';
    };
    
    gameoverImage.onload = function() {
        // 图片加载成功时显示容器，但不改变容器尺寸
        gameoverImageContainer.style.display = 'block';
    };
    
    // 加载图片
    gameoverImage.src = selectedImage;
    
    // 先显示毛玻璃背景
    gameOverOverlay.style.display = 'block';
    
    // 触发淡入动画
    setTimeout(() => {
        gameOverOverlay.classList.add('show');
    }, 10);
    
    // 增加小延迟使毛玻璃效果有平滑过渡，然后显示弹窗
    setTimeout(() => {
        // 重置动画（如果之前已经显示过）
        gameOverEl.style.animation = 'none';
        void gameOverEl.offsetHeight; // 触发重排
        gameOverEl.style.animation = 'pop-in 0.6s ease-out, float 3s ease-in-out 0.6s infinite';
        
        // 确保按钮事件监听器正常工作
        restartBtn.style.pointerEvents = 'auto';
        
        // 显示结算弹窗
        gameOverEl.style.display = 'block';
    }, 300);
    
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

// 添加一个新函数，专门用于处理移动设备的初始化问题
function handleMobileInitialization() {
    // 只在首次加载页面和窗口大小改变时调用
    positionElements();
    
    // 再次确保女孩图片位置正确
    const containerWidth = gameContainer.clientWidth;
    const containerHeight = gameContainer.clientHeight;
    
    let bgScaleFactor;
    const containerAspectRatio = containerWidth / containerHeight;
    const bgAspectRatio = BG_ORIGINAL_WIDTH / BG_ORIGINAL_HEIGHT;
    
    if (containerAspectRatio > bgAspectRatio) {
        bgScaleFactor = containerWidth / BG_ORIGINAL_WIDTH * 1.05;
    } else {
        bgScaleFactor = containerHeight / BG_ORIGINAL_HEIGHT;
    }
    
    const bgDisplayWidth = containerAspectRatio > bgAspectRatio ? 
                          containerWidth * 1.05 : 
                          BG_ORIGINAL_WIDTH * bgScaleFactor * 1.05;
    const bgDisplayHeight = containerAspectRatio > bgAspectRatio ? 
                           BG_ORIGINAL_HEIGHT * bgScaleFactor : 
                           containerHeight;
    
    const bgOffsetX = (containerWidth - bgDisplayWidth) / 2;
    const bgOffsetY = (containerHeight - bgDisplayHeight) / 2;
    
    const girlWidth = GIRL_ORIGINAL_WIDTH * bgScaleFactor * 1.05;
    const girlHeight = GIRL_ORIGINAL_HEIGHT * bgScaleFactor * 1.05;
    
    const girlPositionX = bgOffsetX + (GIRL_POSITION_X_RATIO * bgDisplayWidth) - (girlWidth / 2);
    const girlPositionY = bgOffsetY + (GIRL_POSITION_Y_RATIO * bgDisplayHeight) - girlHeight;
    
    girlBody.style.width = `${girlWidth}px`;
    girlBody.style.height = `${girlHeight}px`;
    girlBody.style.left = `${girlPositionX}px`;
    girlBody.style.top = `${girlPositionY}px`;
}

// 事件监听器
function setupEventListeners() {
    // 开始按钮
    startBtn.addEventListener('click', function() {
        initGame();
        // 尝试播放BGM（响应用户交互）
        document.getElementById('bgm').play().catch(error => {
            console.log('BGM播放失败:', error);
        });
    });
    
    // 图片加载完成事件
    bgTrain.addEventListener('load', imageLoaded);
    girlBody.addEventListener('load', imageLoaded);
    bgCloud1.addEventListener('load', imageLoaded);
    
    // 触摸控制（针对移动设备优化）
    leftBtn.addEventListener('touchstart', (e) => { 
        leftPressed = true; 
        e.preventDefault();
        // 如果游戏已经开始但BGM没有播放，尝试播放
        if (isGameStarted && document.getElementById('bgm').paused) {
            document.getElementById('bgm').play().catch(() => {});
        }
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
    leftBtn.addEventListener('mousedown', () => { 
        leftPressed = true; 
        // 如果游戏已经开始但BGM没有播放，尝试播放
        if (isGameStarted && document.getElementById('bgm').paused) {
            document.getElementById('bgm').play().catch(() => {});
        }
    });
    leftBtn.addEventListener('mouseup', () => { leftPressed = false; });
    leftBtn.addEventListener('mouseleave', () => { leftPressed = false; });
    
    rightBtn.addEventListener('mousedown', () => { 
        rightPressed = true; 
        // 如果游戏已经开始但BGM没有播放，尝试播放
        if (isGameStarted && document.getElementById('bgm').paused) {
            document.getElementById('bgm').play().catch(() => {});
        }
    });
    rightBtn.addEventListener('mouseup', () => { rightPressed = false; });
    rightBtn.addEventListener('mouseleave', () => { rightPressed = false; });
    
    // 重新开始按钮
    restartBtn.addEventListener('click', function(e) {
        // 防止事件冒泡
        e.stopPropagation();
        // 标记点击状态，防止重复点击
        if (this.getAttribute('data-clicked') === 'true') return;
        this.setAttribute('data-clicked', 'true');
        
        // 视觉反馈
        this.style.transform = 'scale(0.95)';
        
        // 重置游戏
        initGame();
        
        // 尝试播放BGM（响应用户交互）
        document.getElementById('bgm').play().catch(() => {});
        
        // 重置按钮状态
        setTimeout(() => {
            this.removeAttribute('data-clicked');
            this.style.transform = '';
        }, 300);
    });
    
    // 为整个结算界面添加点击事件，在按钮区域也能响应点击
    gameOverEl.addEventListener('click', function(e) {
        // 检查点击位置是否在按钮范围内
        const btnRect = restartBtn.getBoundingClientRect();
        const clickX = e.clientX;
        const clickY = e.clientY;
        
        if (clickX >= btnRect.left && clickX <= btnRect.right && 
            clickY >= btnRect.top && clickY <= btnRect.bottom) {
            // 模拟按钮点击
            restartBtn.click();
        }
    });
    
    // 添加触摸事件处理
    gameOverEl.addEventListener('touchend', function(e) {
        // 防止默认行为，如页面滚动
        e.preventDefault();
        
        // 检查触摸结束位置是否在按钮范围内
        const btnRect = restartBtn.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        
        if (touchX >= btnRect.left && touchX <= btnRect.right && 
            touchY >= btnRect.top && touchY <= btnRect.bottom) {
            // 模拟按钮点击
            restartBtn.click();
        }
    }, { passive: false });
    
    // 窗口大小调整
    window.addEventListener('resize', () => {
        positionElements();
        // 专门为移动设备添加额外处理
        handleMobileInitialization();
        
        if (!isGameStarted) {
            // 如果游戏还没开始，需要重置女孩的角度，但保持震动效果
            const mainOffset = Math.sin(trainBouncePhase) * TRAIN_BOUNCE_AMPLITUDE;
            const secondaryOffset = Math.sin(trainSecondaryBouncePhase) * TRAIN_BOUNCE_SECONDARY_AMPLITUDE;
            const totalOffset = mainOffset + secondaryOffset + randomBounceOffset;
            girlBody.style.transform = `translateY(${totalOffset}px) rotate(0deg)`;
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
            // 尝试播放BGM
            if (isGameStarted && document.getElementById('bgm').paused) {
                document.getElementById('bgm').play().catch(() => {});
            }
        } else if (e.key === 'ArrowRight') {
            rightPressed = true;
            // 尝试播放BGM
            if (isGameStarted && document.getElementById('bgm').paused) {
                document.getElementById('bgm').play().catch(() => {});
            }
        } else if (e.key === ' ' && !isGameStarted) {
            // 空格键开始游戏
            initGame();
            // 尝试播放BGM
            document.getElementById('bgm').play().catch(() => {});
        } else if (e.key === ' ' && isGameOver) {
            // 空格键重新开始游戏
            initGame();
            // 尝试播放BGM
            document.getElementById('bgm').play().catch(() => {});
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') {
            leftPressed = false;
        } else if (e.key === 'ArrowRight') {
            rightPressed = false;
        }
    });
    
    // 添加专门针对移动设备的处理
    window.addEventListener('orientationchange', () => {
        // 方向改变后延迟执行，确保新尺寸已经应用
        setTimeout(() => {
            positionElements();
            handleMobileInitialization();
        }, 200);
    });
    
    // 添加页面可见性变化的处理，当用户从其他应用切换回来时重新计算位置
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            handleMobileInitialization();
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
    
    // 重新计算一次女孩的位置，确保在开始界面正确显示
    handleMobileInitialization();
    
    // 重置女孩的角度，但保持震动效果
    const mainOffset = Math.sin(trainBouncePhase) * TRAIN_BOUNCE_AMPLITUDE;
    const secondaryOffset = Math.sin(trainSecondaryBouncePhase) * TRAIN_BOUNCE_SECONDARY_AMPLITUDE;
    const totalOffset = mainOffset + secondaryOffset + randomBounceOffset;
    girlBody.style.transform = `translateY(${totalOffset}px) rotate(0deg)`;
    
    // 强制立即应用样式变更，避免任何可能的渲染延迟问题
    setTimeout(() => {
        // 触发重新渲染
        girlBody.style.display = 'none';
        void girlBody.offsetHeight; // 触发重排
        girlBody.style.display = '';
    }, 50);
    
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