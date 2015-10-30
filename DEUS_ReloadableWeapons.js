//=============================================================================
// Trinary - Reloadable Weapons
// DEUS_ReloadableWeapons.js
// Version: 1.00
//=============================================================================

//=============================================================================
 /*:
 * @plugindesc Allows creation of weapons that have a set amount of ammo that need to be reloaded.
 * @author deusprogrammer
 *
 * @help
 */

var Trinary = Trinary || {};

Trinary.Ammo = {};
Trinary.Ammo.reload = function() {
	var caster = BattleManager._subject;
	if (caster) {
		console.log("RELOADING " + caster._name);
		var weapons = caster.weapons();
		if (weapons[0].isReloadable) {
			weapons[0].shotsLeft = weapons[0].magazineSize;
		}
	}
}

Trinary.Ammo.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    Trinary.Ammo.Game_Interpreter_pluginCommand.call(this, command, args)
    if (command === 'Reload') {
    	Trinary.Ammo.reload();
    }
};

Trinary.Ammo.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!Trinary.Ammo.DataManager_isDatabaseLoaded.call(this)) {
    	return false;
    }
    console.log("LOADING DATABASE");
    this.processAmmoJSON($dataWeapons);
	return true;
}

DataManager.processAmmoJSON = function(group) {
	console.log("PROCESSING JSON");
	for (var n = 1; n < group.length; n++) {
		var obj = group[n];
	
		// Parse the note block to read in the JSON blob
		var depObject = null;
		if (obj.note) {
			depObject = JSON.parse(obj.note);
		}

		// Create a new _mp and _mmp to the maxMp
		if (depObject && depObject["isReloadable"] && depObject["magazineSize"]) {
			obj.isReloadable = depObject["isReloadable"] == "true";
			obj.shotsLeft = obj.magazineSize = depObject["magazineSize"];
		} else {
			obj.isReloadable = false;
			obj.shotsLeft = obj.magazineSize = 0;
		}
		
		console.log(obj.name);
		console.log("\tReloadable: " + obj.isReloadable);
		console.log("\tMagazine:   " + obj.magazineSize);
	}
}

Game_Actor.prototype.canAttack = function() {
    return this.canUse($dataSkills[this.attackSkillId()]) && this.primaryWeaponHasAmmo();
};

Game_Actor.prototype.primaryWeaponHasAmmo = function() {
	var weapons = this.weapons();
	if (!weapons[0].isReloadable || (weapons[0].isReloadable && weapons[0].shotsLeft > 0)) {
		return true;
	}
	
	return false;
}

Game_Actor.prototype.performAttack = function() {
    var weapons = this.weapons();
    var wtypeId = weapons[0] ? weapons[0].wtypeId : 0;
    var attackMotion = $dataSystem.attackMotions[wtypeId];
    if (attackMotion) {
        if (attackMotion.type === 0) {
            this.requestMotion('thrust');
        } else if (attackMotion.type === 1) {
            this.requestMotion('swing');
        } else if (attackMotion.type === 2) {
            this.requestMotion('missile');
        }
        this.startWeaponAnimation(attackMotion.weaponImageId);
    }
    
    if (weapons[0].isReloadable && weapons[0].shotsLeft > 0) {
    	weapons[0].shotsLeft--;
    	console.log("Rounds left: " + weapons[0].shotsLeft);
    }
};

Window_ActorCommand.prototype.addAttackCommand = function() {
	var actor = BattleManager.actor();
	var text  = TextManager.attack;
	if (actor) {
		var weapons = actor.weapons();
		if (weapons[0].isReloadable) {
			text += "(" + weapons[0].shotsLeft + "/" + weapons[0].magazineSize + ")";
    	}
    }
    
    this.addCommand(text, 'attack', this._actor.canAttack());
};