App.boot = function (game) {}

App.boot.prototype.preload = function () {
    console.log(
        "%c %c %c Booting My Awesome Sokoban Knockoff...          %c %c ",
        "background: #ffb740;",
        "background: #ff9620;",
        "color: #fff; background: #ee7600;",
        "background: #ff8720;",
        "background: #ffb740;"
    )
}

App.boot.prototype.create = function () {

    if (App.debug) {
        this.game.time.advancedTiming = true
    }

    this.game.scale.scaleMode = Phaser.ScaleManager.RESIZE
    this.game.scale.pageAlignHorizontally = true
    this.game.scale.pageAlignVertically = true

    this.game.state.start("load")

}

if (App.debug) { App.boot.prototype.render = function () {
    
    this.game.debug.text(this.game.time.fps, 2, this.game.height - 14, "#00ff00");

}}