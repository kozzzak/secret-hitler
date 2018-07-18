const { CURRENTSEASONNUMBER } = require('../../src/frontend-scripts/constants');
const Account = require('../../models/account');

module.exports.games = [];
module.exports.userList = [];
module.exports.generalChats = {
	sticky: '',
	list: []
};
module.exports.accountCreationDisabled = { status: false };
module.exports.ipbansNotEnforced = { status: false };
module.exports.gameCreationDisabled = { status: false };
module.exports.currentSeasonNumber = CURRENTSEASONNUMBER;
module.exports.newStaff = {
	modUserNames: [],
	editorUserNames: []
};

// set of profiles, no duplicate usernames
/**
 * @return // todo
 */
module.exports.profiles = (() => {
	const profiles = [];
	const MAX_SIZE = 100;
	const get = username => profiles.find(p => p._id === username);
	const remove = username => {
		const i = profiles.findIndex(p => p._id === username);
		if (i > -1) return profiles.splice(i, 1)[0];
	};
	const push = profile => {
		if (!profile) return profile;
		remove(profile._id);
		profiles.unshift(profile);
		profiles.splice(MAX_SIZE);
		return profile;
	};

	return { get, push };
})();

module.exports.formattedUserList = () => {
	return module.exports.userList.map(user => ({
		userName: user.userName,
		wins: user.wins,
		losses: user.losses,
		rainbowWins: user.rainbowWins,
		rainbowLosses: user.rainbowLosses,
		isPrivate: user.isPrivate ? true : undefined,
		staffDisableVisibleElo: user.staffDisableVisibleElo,
		staffDisableStaffColor: user.staffDisableStaffColor,

		// Tournaments are disabled, no point sending this.
		// tournyWins: user.tournyWins,

		// Blacklists are sent in the sendUserGameSettings event.
		// blacklist: user.blacklist,
		customCardback: user.customCardback,
		customCardbackUid: user.customCardbackUid,
		eloOverall: user.eloOverall ? Math.floor(user.eloOverall) : undefined,
		eloSeason: user.eloSeason ? Math.floor(user.eloSeason) : undefined,
		status: user.status,
		winsSeason2: user.winsSeason2,
		lossesSeason2: user.lossesSeason2,
		rainbowWinsSeason2: user.rainbowWinsSeason2,
		rainbowLossesSeason2: user.rainbowLossesSeason2,
		winsSeason3: user.winsSeason3,
		lossesSeason3: user.lossesSeason3,
		rainbowWinsSeason3: user.rainbowWinsSeason3,
		rainbowLossesSeason3: user.rainbowLossesSeason3,
		previousSeasonAward: user.previousSeasonAward,
		timeLastGameCreated: user.timeLastGameCreated,
		staffRole: user.staffRole ? user.staffRole : undefined
		// oldData: user
	}));
};

const userListEmitter = {
	state: 0,
	send: false,
	timer: setInterval(() => {
		// 0.01s delay per user (1s per 100), always delay
		if (!userListEmitter.send) {
			userListEmitter.state = module.exports.userList.length / 10;
			return;
		}
		if (userListEmitter.state > 0) userListEmitter.state--;
		else {
			userListEmitter.send = false;
			io.sockets.emit('userList', {
				list: module.exports.formattedUserList()
			});
		}
	}, 100)
};

module.exports.userListEmitter = userListEmitter;

module.exports.formattedGameList = () => {
	return module.exports.games.map(game => ({
		name: game.general.name,
		flag: game.general.flag,
		userNames: game.publicPlayersState.map(val => val.userName),
		customCardback: game.publicPlayersState.map(val => val.customCardback),
		customCardbackUid: game.publicPlayersState.map(val => val.customCardbackUid),
		gameStatus: game.gameState.isCompleted ? game.gameState.isCompleted : game.gameState.isTracksFlipped ? 'isStarted' : 'notStarted',
		seatedCount: game.publicPlayersState.length,
		gameCreatorName: game.general.gameCreatorName,
		minPlayersCount: game.general.minPlayersCount,
		maxPlayersCount: game.general.maxPlayersCount || game.general.minPlayersCount,
		excludedPlayerCount: game.general.excludedPlayerCount,
		casualGame: game.general.casualGame || undefined,
		eloMinimum: game.general.eloMinimum || undefined,
		isVerifiedOnly: game.general.isVerifiedOnly || undefined,
		isTourny: game.general.isTourny || undefined,
		timedMode: game.general.timedMode || undefined,
		tournyStatus: (() => {
			if (game.general.isTourny) {
				if (game.general.tournyInfo.queuedPlayers && game.general.tournyInfo.queuedPlayers.length) {
					return {
						queuedPlayers: game.general.tournyInfo.queuedPlayers.length
					};
				}
			}
			return undefined;
		})(),
		experiencedMode: game.general.experiencedMode || undefined,
		disableChat: game.general.disableChat || undefined,
		disableGamechat: game.general.disableGamechat || undefined,
		blindMode: game.general.blindMode || undefined,
		enactedLiberalPolicyCount: game.trackState.liberalPolicyCount,
		enactedFascistPolicyCount: game.trackState.fascistPolicyCount,
		electionCount: game.general.electionCount,
		rebalance6p: game.general.rebalance6p || undefined,
		rebalance7p: game.general.rebalance7p || undefined,
		rebalance9p: game.general.rerebalance9p || undefined,
		privateOnly: game.general.privateOnly || undefined,
		private: game.general.private || undefined,
		uid: game.general.uid,
		rainbowgame: game.general.rainbowgame || undefined
	}));
};

const gameListEmitter = {
	state: 0,
	send: false,
	timer: setInterval(() => {
		// 3 second delay, instant send
		if (gameListEmitter.state > 0) gameListEmitter.state--;
		else {
			if (!gameListEmitter.send) return;
			gameListEmitter.send = false;
			io.sockets.emit('gameList', module.exports.formattedGameList());
			gameListEmitter.state = 30;
		}
	}, 100)
};

module.exports.gameListEmitter = gameListEmitter;

module.exports.AEM = Account.find({ staffRole: { $exists: true } });
