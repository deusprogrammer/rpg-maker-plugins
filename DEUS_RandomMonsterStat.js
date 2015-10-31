// Create namespace to avoid overwriting other similarly named functions
Trinary = Trinary || {};
Trinary.RandomEnemy = {};

// Get a random number from an interval
Trinary.RandomEnemy.randomIntFromInterval = function(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

// Override the getter functions for mhp and mmp to include the random variance we add
Object.defineProperties(Game_Enemy.prototype, {
	// Maximum Health Points
	mhp: { get: function() { return this.param(0) + this._mhpv }, configurable: true },
	// Maximum Magic Points
    mmp: { get: function() { return this.param(1) + this._mmpv }, configurable: true }
});

// Override the setup function to retrieve our variance amounts from the note field
Game_Enemy.prototype.setup = function(enemyId, x, y) {
    this._enemyId = enemyId;
    this._screenX = x;
    this._screenY = y;
    
    // Initialize the variance variables
    this._mmpv = 0;
    this._mhpv = 0;
    
    // Get the note 
    var note = $dataEnemies[enemyId].note;
    
    // Set the variance variables to what we had in the note field if they are defined
    if (note) {
    	var obj = JSON.parse(note);
    	if (obj.hpv) {
    		this._mhpv = Trinary.RandomEnemy.randomIntFromInterval(-1 * obj.hpv, obj.hpv);
    	}
    	if (obj.mpv) {
    		this._mmpv = Trinary.RandomEnemy.randomIntFromInterval(-1 * obj.mpv, obj.mpv);
    	}
    }
    
    this.recoverAll();
};

// Adding some console logging to check what the enemy stats are.
BattleManager.setup = function(troopId, canEscape, canLose) {
    this.initMembers();
    this._canEscape = canEscape;
    this._canLose = canLose;
    $gameTroop.setup(troopId);
    
    var enemies = $gameTroop.members();
    for (var i = 0; i < enemies.length; i++) {
    	var enemy = enemies[i];
    	console.log("ENEMY HP: " + enemy.mhp);
    	console.log("ENEMY MP: " + enemy.mmp);
    }
    
    $gameScreen.onBattleStart();
    this.makeEscapeRatio();
};