var GameInput = function (game, scene) {

    console.log(
        "%c %c %c Starting input...                               %c %c ",
        "background: #ffb740;",
        "background: #ff9620;",
        "color: #fff; background: #ee7600;",
        "background: #ff8720;",
        "background: #ffb740;"
    )

    this.game = game
    this.scene = scene

    this.startX = null
    this.startY = null

    this.endX = null
    this.endY = null

    this.keys = {
        "up": {
            key: Phaser.KeyCode.UP,
            action: function() { this.scene.movePlayer(UP) }
        },
        "down": {
            key: Phaser.KeyCode.DOWN,
            action: function() { this.scene.movePlayer(DOWN) }
        },
        "left": {
            key: Phaser.KeyCode.LEFT,
            action: function() { this.scene.movePlayer(LEFT) }
        },
        "right": {
            key: Phaser.KeyCode.RIGHT,
            action: function() { this.scene.movePlayer(RIGHT) }
        },
        "undo": {
            key: Phaser.KeyCode.U,
            action: function() { this.scene.undoMove() }
        }
    }
}

GameInput.prototype.initSwipe = function () {
    this.game.input.onDown.addOnce(this.startSwipe.bind(this))
}

GameInput.prototype.startSwipe = function () {

    this.startX = this.game.input.worldX
    this.startY = this.game.input.worldY
    this.game.input.onUp.addOnce(this.endSwipe.bind(this))

}

GameInput.prototype.endSwipe = function () {

    this.endX = this.game.input.worldX
    this.endY = this.game.input.worldY

    var distX = this.endX-this.startX
    var distY = this.endY-this.startY

    if (distY < 0 && distY < -(Math.abs(distX)*2)) {
        this.scene.movePlayer(UP)
    } else if (distY > 0 && distY > Math.abs(distX)*2) {
        this.scene.movePlayer(DOWN)
    } else if (distX < 0 && distX < -(Math.abs(distY)*2)) {
        this.scene.movePlayer(LEFT)
    } else if (distX > 0 && distX > Math.abs(distY)*2) {
        this.scene.movePlayer(RIGHT)
    }

    this.game.input.onDown.addOnce(this.startSwipe.bind(this))

}

GameInput.prototype.initKeys = function() {
    this.rebuildKeymap()
    this.game.input.keyboard.addCallbacks(this,this.keyDown)
}

GameInput.prototype.rebuildKeymap = function() {

    this.keymap = {}
    for (var k in this.keys) {
        if (!this.keys.hasOwnProperty(k)) {
            continue
        }

        this.keymap[this.keys[k].key] = this.keys[k].action
    }

}

GameInput.prototype.keyDown = function(event) {

    if (!this.keymap.hasOwnProperty(event.keyCode)) {
        return
    }

    this.keymap[event.keyCode].bind(this)()

}
