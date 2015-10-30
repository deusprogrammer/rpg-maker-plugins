//=============================================================================
// Trinary - Depletable Equipment
// DEUS_DepletableEquipment.js
// Version: 1.00
//=============================================================================

//=============================================================================
 /*:
 * @plugindesc Allows equipment to have a collective MP pool that can override the 
 * character class's MP pool.
 * @author deusprogrammer
 *
 * @param onlyArmorHasMp
 * @desc Only armor grants MP when this parameter is true.  Otherwise both the armor
 * and the class MP will be available to the player.
 * @default true
 *
 * @help
 */

var Trinary = Trinary || {};

Trinary.DEquip = {
	parameters: {
		onlyArmorHasMp: PluginManager.parameters("DEUS_DepletableEquipment") == "true"
	}
};

Trinary.DEquip.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!Trinary.DEquip.DataManager_isDatabaseLoaded.call(this)) {
    	return false;
    }
    console.log("LOADING DATABASE");
    this.processDEquipJSON($dataArmors);
	return true;
}

DataManager.processDEquipJSON = function(group) {
	console.log("PROCESSING JSON");
	for (var n = 1; n < group.length; n++) {
		var obj = group[n];
	
		// Parse the note block to read in the JSON blob
		var depObject = null;
		if (obj.note) {
			depObject = JSON.parse(obj.note);
		}

		// Create a new _mp and _mmp to the maxMp
		if (depObject && depObject["maxMp"]) {
			obj._mp = obj._mmp = depObject["maxMp"];
		} else {
			obj._mp = obj._mmp = 0;
		}
		
		console.log("MP (" + obj.name + "): " + obj._mmp);
	}
}

Object.defineProperties(Game_Actor.prototype, {
	// Magic Points
	mp: { get: function() { return this.getEquipMp(); }, configurable: true },
	// Maximum Magic Points
    mmp: { get: function() { return this.getMaxEquipMp(); }, configurable: true }
});

Game_BattlerBase.prototype.recoverAll = function() {
    this.clearStates();
    this._hp = this.mhp;
    this._mp = this.param(1);
};

Game_Actor.prototype.getEquipMp = function() {
	var total = 0;
	for(var i = 0; i < this.armors().length; i++) {
		var armor = this.armors()[i];
	
		if (armor._mp) {
			total += armor._mp;
		}
	}
	
	if (!Trinary.DEquip.parameters.onlyArmorHasMp) {
		total += this._mp;
	}
	
	return total;
}

Game_Actor.prototype.getMaxEquipMp = function() {
	var total = 0;
	for(var i = 0; i < this.armors().length; i++) {
		var armor = this.armors()[i];
		
		if (armor._mmp) {
			total += armor._mmp;
		}
	}
	
	if (!Trinary.DEquip.parameters.onlyArmorHasMp) {
		total += this.param(1);
	}
	
	return total;
}

Game_Actor.prototype.canPaySkillCost = function(skill) {
    return this._tp >= this.skillTpCost(skill) && this.getEquipMp() >= this.skillMpCost(skill);
};

Game_Actor.prototype.paySkillCost = function(skill) {
	this._tp -= this.skillTpCost(skill);
	
	var mpCost = this.skillMpCost(skill);
	if (mpCost > 0) {
		this.distributeMpLoss(mpCost);
	} else {
		this.distributeMpGain(Math.abs(mpCost));
	}
};

Game_Actor.prototype.gainMp = function(value) {
    this._result.mpDamage = -value;
    if (value > 0) {
    	this.distributeMpGain(value);
    } else {
    	this.distributeMpLoss(Math.abs(value));
    }
};

Game_Actor.prototype.distributeMpLoss = function(cost) {
	while (cost > 0  && this.getEquipMp() > 0) {
		// Remove MP from armor pieces equally.
		for (var i = 0; i < this.armors().length && cost > 0; i++) {
			var armor = this.armors()[i];
		
			if (armor._mp > 0) {
				armor._mp--;
				cost--;
			}
		}
		
		if (!Trinary.DEquip.parameters.onlyArmorHasMp && this._mp > 0 && cost > 0) {
			this._mp--;
			cost--;
		}
    }
};

Game_Actor.prototype.distributeMpGain = function(gain) {
	while (gain > 0 && this.getEquipMp() < this.getMaxEquipMp()) {
		// Add MP to armor pieces equally.
		for (var i = 0; i < this.armors().length && gain > 0; i++) {
			var armor = this.armors()[i];
		
			if (armor._mp < armor._mmp) {
				armor._mp++;
				gain--;
			}
		}
		
		if (!Trinary.DEquip.parameters.onlyArmorHasMp && this._mp < this.param(1) && gain > 0) {
			this._mp++;
			gain--;
		}
    }
};