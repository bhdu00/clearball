
var config = {
    type: Phaser.AUTO,
    width: 820,
    height: 930,
    backgroundColor: 0x705045,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const rowNum = 8;
const columnNum = 8;
const colorNum = 6; // max 8

var self;


var score = 0;
var gameOver = false;
var ballSelected = false;
var ballscleared = false;
var startOrUserMoved = true;
var selRow;
var selCol;
var scoreText;

// Create board
var board = createBoard();

// Create next queue
var nextQueue = [3];

var game = new Phaser.Game(config);

function preload () {
    this.load.image('1', 'assets/circle_black.png');
    this.load.image('2', 'assets/circle_white.png');
    this.load.image('3', 'assets/circle_blue.png');
    this.load.image('4', 'assets/circle_green.png');
    this.load.image('5', 'assets/circle_yellow.png');
    this.load.image('6', 'assets/circle_red.png');
    this.load.image('7', 'assets/circle_orange.png');
    this.load.image('8', 'assets/circle_gray.png');
}

function create () {

    console.log('create');

    // The board
    let path = this.add.path(0, 15);
    let graphics = this.add.graphics();
    drawBoard(graphics);

    // The score
    scoreText = this.add.text(10, 10, 'SCORE: ' + score, { fontSize: '32px', fill: '#ffffff' });
    // The "NEXT" wording
    nextText = this.add.text(410, 10, 'NEXT:', { fontSize: '32px', fill: '#ffffff' });

    self = this;

    // Creat 3 balls
    creatBalls();

    // Mouse Down Event
    this.input.on("pointerdown", clickBoard);
}

function update () {
    if (gameOver) {
        this.scene.stop();
    }

    if (startOrUserMoved && !ballscleared) { // if this turn has not cleared balls
        // Move 3 balls
        moveBallsBoard();
        
        // Creat next 3 balls
        creatBalls();

        startOrUserMoved = false;
    }
}

function createBoard () {
    let board = [];
    for (let i = 0; i < rowNum; i++) {
      board[i] = new Array();
      for (let j = 0; j < columnNum; j++) {
        board[i][j] = null;
      }
    }
    return board;
}

function drawBoard (graphics) {
    graphics.lineStyle(1, 0xffffff, 1);
    for (let i = 0; i <= rowNum; i++) {
      graphics.moveTo(10, 120 + i * 100);
      graphics.lineTo(10 + rowNum * 100, 120 + i * 100);
    }
    for (let j = 0; j <= columnNum; j++) {
      graphics.moveTo(10 + j * 100, 120);
      graphics.lineTo(10 + j * 100, 120 + columnNum * 100);
    }
    // The next 3-ball window
    for (let i = 0; i < 2; i++) {
        graphics.moveTo(510, 10 + i * 100);
        graphics.lineTo(810, 10 + i * 100);
    }
    for (let j = 0; j < 4; j++) {
        graphics.moveTo(510 + j * 100, 10);
        graphics.lineTo(510 + j * 100, 110);
    }
    graphics.strokePath();
}

function creatBalls () {
    for (let i = 0; i < 3; i++) {
        // random the ball's color
        let color = Phaser.Math.Between(1, colorNum);
        
        console.log('create ball, color:' + color);
        
        // put the ball to next 3-ball window
        let ball = self.add.sprite(560 + i * 100, 60, color).setInteractive();

        // put ball object to nextQueue
        nextQueue[i] = ball;
    }
}

function moveBallsBoard () {
    // count board empty position
    var emptyNum = 0;
    for (let a = 0; a < rowNum; a++) {
        for (let b = 0; b < columnNum; b++) {
            if (board[a][b] === null) {
                emptyNum++;
            }
        }
    }
    // game over
    if (emptyNum < 3) {
        gameOver = true;
        return;
    }

    // move ball to board
    for (let i = 0; i < 3; i++) {
        let randomNum = Phaser.Math.Between(1,  emptyNum - i);

        console.log('random:' + randomNum);

        loop1:
        for (let a = 0; a < rowNum; a++) {
            loop2:
            for (let b = 0; b < columnNum; b++) {
                if (board[a][b] === null) {
                    if (randomNum == 1) {

                        console.log('move:(' + a + ', ' + b + ')');

                        board[a][b] = nextQueue[i];
                        self.tweens.add({
                            targets: board[a][b],
                            x: 60 + a * 100,
                            y: 170 + b * 100,
                            duration: 1000
                        });

                        clearballs(a, b);

                        break loop1;
                    }
                    else {
                        randomNum--;
                    }
                }
            }
        }

    }
}

function clickBoard (pointer) {
    
    console.log('x=' + pointer.x + ', y=' + pointer.y);

    // Out of grid range
    if (pointer.x % 100 < 20 || (pointer.y - 110) % 100 < 20) {
        console.log('out of grid range');
        return;
    }
    let row = Math.floor((pointer.x - 10) / 100);
    let col = Math.floor((pointer.y - 120) / 100);
    console.log('select grid:(' + row + ', ' + col + ')');
    console.log('grid had ball?' + board[row][col]);
    console.log('ballSelected:' + ballSelected);

    // Selected grid is empty
    if (board[row][col] === null) {
        if (ballSelected == true) {
            let movepath = getPath(selRow.toString() + selCol.toString(), row.toString() + col.toString());

            console.log('movepath=' + movepath);

            if (movepath.length > 0) {
                // stop tween
                let t = self.tweens.getTweensOf(board[selRow][selCol]);
                self.tweens.remove(t);

                // move
                // [todo] move by path
                board[row][col] = board[selRow][selCol];
                board[selRow][selCol] = null;
                board[row][col].x = 60 + row * 100;
                board[row][col].y = 170 + col * 100;
                startOrUserMoved = true;
                ballSelected = false;

                // clear continuous 5 or more balls
                clearballs(row, col);
            }
        }
    }
    // Selected grid had a ball
    else {
        // A ball has selected
        if (ballSelected == true) {
            // stop tween
            let t = self.tweens.getTweensOf(board[selRow][selCol]);
            self.tweens.remove(t);
            board[selRow][selCol].y = 170 + selCol * 100; // move back to original position
        }
        // Shake new selected ball 
        ballSelected = true;
        selRow = row;
        selCol = col;
        board[selRow][selCol].y += 5; // move down 5 pixels
        self.tweens.add({
            targets: board[selRow][selCol],
            y: 165 + selCol * 100, // shake 10 pixels(175 - 165)
            duration: 150,
            yoyo: true,
            loop: -1
        });

    }

    console.log('ballSelected:' + ballSelected);

}

function getPath (from, to) {
    var path = [from];
    var queue = [from];
    
    console.log('from:' + from + ', to:' + to);

    while (true) {

        let len = path.length;
        if (len == 0 || path[len -1].toString() == to.toString()) {
            break;
        }

        let row = parseInt(path[path.length -1].substr(0, 1));
        let col = parseInt(path[path.length -1].substr(1, 1));

        // up
        if (col > 0 && board[row][col - 1] === null && 
            queue.indexOf(row.toString() + (col - 1).toString()) === -1) {
            path.push(row.toString() + (col - 1).toString());
            queue.push(row.toString() + (col - 1).toString());
        }
        // down
        else if (col < columnNum - 1 && board[row][col + 1] === null && 
            queue.indexOf(row.toString() + (col + 1).toString()) === -1) {
            path.push(row.toString() + (col + 1).toString());
            queue.push(row.toString() + (col + 1).toString());
        }
        // left
        else if (row > 0 && board[row - 1][col] === null && 
            queue.indexOf((row -1).toString() + col.toString()) === -1) {
            path.push((row - 1).toString() + col.toString());
            queue.push((row - 1).toString() + col.toString());
        }
        // right
        else if (row < rowNum - 1 && board[row + 1][col] === null && 
            queue.indexOf((row + 1).toString() + col.toString()) === -1) {
            path.push((row + 1).toString() + col.toString());
            queue.push((row + 1).toString() + col.toString());
        }
        else {
            path.pop();
        }

        //console.log('path:' + path);
        //console.log('queue:' + queue);
    }
    return path;
}

function clearballs(row, col) {

    console.log('check clear ball:' + board[row][col].texture.key);

    var color = board[row][col].texture.key;
    var clears = [];
    var up, dn, lt, rt;

    // horizon
    lt = row - 1; // left
    while (lt >= 0 && board[lt][col] != null) {
        if (board[lt][col].texture.key == color) {
            lt--;
        }
        else break;
    }
    rt = row + 1; // right
    while (rt < rowNum && board[rt][col] != null) {
        if (board[rt][col].texture.key == color) {
            rt++;
        }
        else break;
    }
    if (rt - lt - 1 >= 5) {
        for (let i = lt + 1; i <= rt - 1; i++) {
            if (clears.indexOf(i.toString() + col.toString()) === -1 ) {
                clears.push(i.toString() + col.toString());
            }
        }
    }

    // vertical
    up = col - 1; // up
    while (up >= 0 && board[row][up] != null) {
        if (board[row][up].texture.key == color) {
            up--;
        }
        else break;
    }
    dn = col + 1; // down
    while (dn < columnNum && board[row][dn] != null) {
        if (board[row][dn].texture.key == color) {
            dn++;
        }
        else break;
    }
    if (dn - up - 1 >= 5) {
        for (let i = up + 1; i <= dn - 1; i++) {
            if (clears.indexOf(row.toString() + i.toString()) === -1 ) {
                clears.push(row.toString() + i.toString());
            }
        }
    }

    // diagonal upper left to lower right
    lt = row - 1; // left
    up = col - 1; // up
    while (lt >= 0 && up >= 0 && board[lt][up] != null) {
        if (board[lt][up].texture.key == color) {
            lt--;
            up--;
        }
        else break;
    }
    rt = row + 1; // right
    dn = col + 1; // down
    while (rt < rowNum && dn < columnNum && board[rt][dn] != null) {
        if (board[rt][dn].texture.key == color) {
            rt++;
            dn++;
        }
        else break;
    }
    if (rt - lt - 1 >= 5) {
        for (let i = lt + 1; i <= rt - 1; i++) {
            if (clears.indexOf(i.toString() + (i + (dn - rt)).toString()) === -1 ) {
                clears.push(i.toString() + (i + (dn - rt)).toString());
            }
        }
    }

    // diagonal lower left to upper right
    lt = row - 1; // left
    dn = col + 1; // down
    while (lt >= 0 && dn < columnNum && board[lt][dn] != null) {
        if (board[lt][dn].texture.key == color) {
            lt--;
            dn++;
        }
        else break;
    }
    rt = row + 1; // right
    up = col - 1; // up
    while (rt < rowNum && up >= 0 && board[rt][up] != null) {
        if (board[rt][up].texture.key == color) {
            rt++;
            up--;
        }
        else break;
    }
    if (rt - lt - 1 >= 5) {
        for (let i = lt + 1; i <= rt - 1; i++) {
            if (clears.indexOf(i.toString() + (up + rt - i).toString()) === -1 ) {
                clears.push(i.toString() + (up + rt - i).toString());
            }
        }
    }

    console.log('up:' + up);
    console.log('down:' + dn);
    console.log('left:' + lt);
    console.log('right:' + rt);

    console.log('clear balls:' + clears);

    ballscleared = false;
    // clear balls
    while (clears.length > 0) {
        console.log('clears.length:' + clears.length);
        
        c = clears.pop();
        board[c.substr(0, 1)][c.substr(1, 1)].destroy();
        board[c.substr(0, 1)][c.substr(1, 1)] = null;
        ballscleared = true;
        score += 1;
    }

    scoreText.text = 'SCORE: ' + score;
}