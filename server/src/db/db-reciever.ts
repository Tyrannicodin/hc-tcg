import assert from 'assert'
import {CARDS} from 'common/cards'
import {defaultAppearance} from 'common/cosmetics/default'
import {PlayerModel} from 'common/models/player-model'
import {serverMessages} from 'common/socket-messages/server-messages'
import {GameOutcome} from 'common/types/game-state'
import {generateDatabaseCode} from 'common/utils/database-codes'
import root from 'serverRoot'
import {call} from 'typed-redux-saga'
import {broadcast} from 'utils/comm'
import {
	RecievedClientMessage,
	clientMessages,
} from '../../../common/socket-messages/client-messages'
import {defaultAppearance} from 'common/cosmetics/default'

function* noDatabaseConnection(playerId: string) {
	const player = root.players[playerId]
	broadcast([player], {type: serverMessages.NO_DATABASE_CONNECTION})
}

export function* addUser(
	action: RecievedClientMessage<typeof clientMessages.PG_INSERT_USER>,
) {
	if (!root.db?.connected) {
		yield* noDatabaseConnection(action.playerId)
		return
	}
	const result = yield* call(
		[root.db, root.db.insertUser],
		action.payload.username ? action.payload.username : '',
		action.payload.minecraftName,
	)

	const player = root.players[action.playerId]

	if (result.type === 'success') {
		player.uuid = result.body.uuid
		player.authenticated = true
		broadcast([player], {
			type: serverMessages.ACHIEVEMENTS_RECIEVED,
			progress: player.achievementProgress,
		})
		broadcast([player], {type: serverMessages.AUTHENTICATED, user: result.body})
	} else {
		broadcast([player], {type: serverMessages.AUTHENTICATION_FAIL})
	}
}

export function* authenticateUser(
	action: RecievedClientMessage<typeof clientMessages.PG_AUTHENTICATE>,
) {
	if (!root.db?.connected) {
		yield* noDatabaseConnection(action.playerId)
		return
	}
	const result = yield* call(
		[root.db, root.db.authenticateUser],
		action.payload.userId,
		action.payload.secret,
	)

	const player = root.players[action.playerId]

	if (player && result.type === 'success') {
		player.uuid = result.body.uuid
		player.authenticated = true

		const achievementProgress = yield* call(
			[root.db, root.db.getAchievements],
			player.uuid,
		)
		if (achievementProgress.type === 'success') {
			player.achievementProgress = achievementProgress.body.achievementData
			broadcast([player], {
				type: serverMessages.ACHIEVEMENTS_RECIEVED,
				progress: player.achievementProgress,
			})
		}

		broadcast([player], {type: serverMessages.AUTHENTICATED, user: result.body})
	} else {
		broadcast([player], {type: serverMessages.AUTHENTICATION_FAIL})
	}
}

export function* getDecks(
	action: RecievedClientMessage<typeof clientMessages.GET_DECKS>,
) {
	assert(root.db.connected, CONNECTION_ASSERTION_MSG)
	const player = root.players[action.playerId]

	const decksResult = yield* call(
		[root.db, root.db.getDecksFromUuid],
		player.uuid,
	)
	const tagsResult = yield* call([root.db, root.db.getTags], player.uuid)

	if (decksResult.type === 'success' && tagsResult.type === 'success') {
		broadcast([player], {
			type: serverMessages.DECKS_RECIEVED,
			decks: decksResult.body,
			tags: tagsResult.body,
			newActiveDeck: action.payload.newActiveDeck
				? decksResult.body.find(
						(deck) => deck.code === action.payload.newActiveDeck,
					)
				: undefined,
		})
	} else if (decksResult.type !== 'success') {
		broadcast([player], {
			type: serverMessages.DATABASE_FAILURE,
			error: decksResult.reason,
		})
	}
}

export function* insertDeck(
	action: RecievedClientMessage<typeof clientMessages.INSERT_DECK>,
) {
	assert(root.db.connected, CONNECTION_ASSERTION_MSG)
	const player = root.players[action.playerId]

	const deckTags = action.payload.deck.tags

	for (let i = 0; i < deckTags.length; i++) {
		yield* call(
			[root.db, root.db.insertTag],
			player.uuid,
			deckTags[i].name,
			deckTags[i].color,
			deckTags[i].key,
		)
	}

	// Insert deck
	const result = yield* call(
		[root.db, root.db.insertDeck],
		action.payload.deck.name,
		action.payload.deck.icon,
		action.payload.deck.iconType,
		action.payload.deck.cards.map((card) => card.props.numericId),
		deckTags.map((tag) => tag.key),
		action.payload.deck.code,
		player.uuid,
	)

	if (result.type === 'failure') {
		broadcast([player], {
			type: serverMessages.DATABASE_FAILURE,
			error: result.reason,
		})
		return
	}

	if (action.payload.newActiveDeck) {
		yield* getDecks(action as any)
	}
}

export function* updateDeck(
	action: RecievedClientMessage<typeof clientMessages.UPDATE_DECK>,
) {
	assert(root.db.connected, CONNECTION_ASSERTION_MSG)
	const player = root.players[action.playerId]
	const deckTags = action.payload.deck.tags

	for (let i = 0; i < deckTags.length; i++) {
		yield* call(
			[root.db, root.db.insertTag],
			player.uuid,
			deckTags[i].name,
			deckTags[i].color,
			deckTags[i].key,
		)
	}

	// Update deck
	const result = yield* call(
		[root.db, root.db.updateDeck],
		action.payload.deck.name,
		action.payload.deck.icon,
		action.payload.deck.iconType,
		deckTags.map((tag) => tag.key),
		action.payload.deck.code,
		player.uuid,
	)

	if (result.type === 'failure') {
		broadcast([player], {
			type: serverMessages.DATABASE_FAILURE,
			error: result.reason,
		})
		return
	}

	if (action.payload.newActiveDeck) {
		yield* getDecks(action as any)
	}
}

export function* insertDecks(
	action: RecievedClientMessage<typeof clientMessages.INSERT_DECKS>,
) {
	assert(root.db.connected, CONNECTION_ASSERTION_MSG)
	const player = root.players[action.playerId]

	// Insert deck
	for (let d = 0; d < action.payload.decks.length; d++) {
		const deck = action.payload.decks[d]
		const deckTags = deck.tags

		for (let i = 0; i < deckTags.length; i++) {
			yield* call(
				[root.db, root.db.insertTag],
				player.uuid,
				deckTags[i].name,
				deckTags[i].color,
				deckTags[i].key,
			)
		}

		const result = yield* call(
			[root.db, root.db.insertDeck],
			deck.name,
			deck.icon,
			deck.iconType,
			deck.cards.map((card) => card.props.numericId),
			deckTags.map((tag) => tag.key),
			deck.code,
			player.uuid,
		)

		if (result.type === 'failure') {
			broadcast([player], {
				type: serverMessages.DATABASE_FAILURE,
				error: result.reason,
			})
		}
	}

	if (action.payload.newActiveDeck) {
		yield* getDecks(action as any)
	}
}

export function* importDeck(
	action: RecievedClientMessage<typeof clientMessages.IMPORT_DECK>,
) {
	assert(root.db.connected, CONNECTION_ASSERTION_MSG)
	const player = root.players[action.playerId]

	const code = action.payload.code

	const importedDeck = yield* call([root.db, root.db.getDeckFromID], code, true)

	if (importedDeck.type !== 'success') return

	if (
		!importedDeck.body.name ||
		!importedDeck.body.icon ||
		!importedDeck.body.iconType
	) {
		importedDeck.body.name = action.payload.newName
		importedDeck.body.iconType = action.payload.newIconType
		importedDeck.body.icon = action.payload.newIcon
	}

	const newCode = generateDatabaseCode()

	// Insert deck
	const result = yield* call(
		[root.db, root.db.insertDeck],
		importedDeck.body.name,
		importedDeck.body.icon,
		importedDeck.body.iconType,
		importedDeck.body.cards.map((card) => CARDS[card].numericId),
		[],
		newCode,
		player.uuid,
	)

	if (result.type === 'failure') {
		broadcast([player], {
			type: serverMessages.DATABASE_FAILURE,
			error: result.reason,
		})
		return
	}

	if (action.payload.newActiveDeck) {
		const newPayload: RecievedClientMessage<typeof clientMessages.GET_DECKS> = {
			type: 'GET_DECKS',
			payload: {
				type: 'GET_DECKS',
				newActiveDeck: newCode,
			},
			playerId: action.playerId,
			playerSecret: action.playerSecret,
		}
		yield* getDecks(newPayload)
	}
}

export function* exportDeck(
	action: RecievedClientMessage<typeof clientMessages.EXPORT_DECK>,
) {
	assert(root.db.connected, CONNECTION_ASSERTION_MSG)
	const player = root.players[action.playerId]

	const result = yield* call(
		[root.db, root.db.setAsExported],
		action.payload.code,
		player.uuid,
	)

	if (result.type === 'failure') {
		broadcast([player], {
			type: serverMessages.DATABASE_FAILURE,
			error: result.reason,
		})
	}
}

export function* grabCurrentImport(
	action: RecievedClientMessage<typeof clientMessages.GRAB_CURRENT_IMPORT>,
) {
	assert(root.db.connected, CONNECTION_ASSERTION_MSG)
	const player = root.players[action.playerId]

	if (!action.payload.code) {
		broadcast([player], {
			type: serverMessages.CURRENT_IMPORT_RECIEVED,
			deck: null,
		})
		return
	}

	const importedDeck = yield* call(
		[root.db, root.db.getDeckFromID],
		action.payload.code,
		true,
	)

	if (importedDeck.type !== 'success') {
		broadcast([player], {
			type: serverMessages.DATABASE_FAILURE,
			error: importedDeck.reason,
		})
		return
	}

	broadcast([player], {
		type: serverMessages.CURRENT_IMPORT_RECIEVED,
		deck: importedDeck.body,
	})
}

export function* setShowData(
	action: RecievedClientMessage<typeof clientMessages.MAKE_INFO_PUBLIC>,
) {
	assert(root.db.connected, CONNECTION_ASSERTION_MSG)
	const player = root.players[action.playerId]

	const result = yield* call(
		[root.db, root.db.setShowData],
		action.payload.public,
		action.payload.code,
		player.uuid,
	)

	if (result.type === 'failure') {
		broadcast([player], {
			type: serverMessages.DATABASE_FAILURE,
			error: result.reason,
		})
	}
}

export function* deleteDeck(
	action: RecievedClientMessage<typeof clientMessages.DELETE_DECK>,
) {
	assert(root.db.connected, CONNECTION_ASSERTION_MSG)
	const player = root.players[action.playerId]

	const result = yield* call(
		[root.db, root.db.deleteDeck],
		action.payload.deck.code,
		player.uuid,
	)

	if (result.type === 'failure') {
		broadcast([player], {
			type: serverMessages.DATABASE_FAILURE,
			error: result.reason,
		})
	}
}

export function* deleteTag(
	action: RecievedClientMessage<typeof clientMessages.DELETE_TAG>,
) {
	assert(root.db.connected, CONNECTION_ASSERTION_MSG)
	const player = root.players[action.playerId]

	const result = yield* call(
		[root.db, root.db.deleteTag],
		player.uuid,
		action.payload.tag.key,
	)

	if (result.type === 'failure') {
		broadcast([player], {
			type: serverMessages.DATABASE_FAILURE,
			error: result.reason,
		})
	}
}

export function* getStats(
	action: RecievedClientMessage<typeof clientMessages.GET_STATS>,
) {
	if (!root.db?.connected) return
	const defaultStats = {
		gamesPlayed: 0,
		wins: 0,
		losses: 0,
		forfeitWins: 0,
		forfeitLosses: 0,
		ties: 0,
	}

	const player = root.players[action.playerId]
	if (!player.authenticated || !player.uuid) {
		broadcast([player], {
			type: serverMessages.STATS_RECIEVED,
			stats: defaultStats,
			gameHistory: [],
		})
		return
	}

	const statsResult = yield* call([root.db, root.db.getUserStats], player.uuid)
	const historyResult = yield* call(
		[root.db, root.db.getUserGameHistory],
		player.uuid,
	)

	if (statsResult.type === 'success' && historyResult.type === 'success') {
		broadcast([player], {
			type: serverMessages.STATS_RECIEVED,
			stats: statsResult.body,
			gameHistory: historyResult.body,
		})
	} else {
		if (statsResult.type === 'failure') {
			broadcast([player], {
				type: serverMessages.DATABASE_FAILURE,
				error: statsResult.reason,
			})
		} else if (historyResult.type === 'failure') {
			broadcast([player], {
				type: serverMessages.DATABASE_FAILURE,
				error: historyResult.reason,
			})
		}
	}
}

export function* addGame(
	firstPlayerModel: PlayerModel,
	secondPlayerModel: PlayerModel,
	outcome: GameOutcome,
	gameLength: number,
	winner: string | null,
	seed: string,
	turns: number,
	replay: Buffer,
	opponentCode: string | null,
) {
	assert(root.db.connected, CONNECTION_ASSERTION_MSG)
	if (!firstPlayerModel.uuid || !secondPlayerModel.uuid) return
	if (!firstPlayerModel.deck || !secondPlayerModel.deck) return

	yield* call(
		[root.db, root.db.insertGame],
		firstPlayerModel.deck.code,
		secondPlayerModel.deck.code,
		firstPlayerModel.uuid,
		secondPlayerModel.uuid,
		outcome,
		gameLength,
		winner,
		seed,
		turns,
		replay,
		opponentCode,
	)
}

export function* sendAfterGameInfo(players: Array<PlayerModel>) {
	for (let i = 0; i < players.length; i++) {
		const player = players[i]
		const stats = yield* call([root.db, root.db.getUserStats], player.uuid)
		const gameHistory = yield* call(
			[root.db, root.db.getUserGameHistory],
			player.uuid,
		)

		if (stats.type !== 'success') {
			broadcast([player], {
				type: serverMessages.DATABASE_FAILURE,
				error: stats.reason,
			})
			continue
		}
		if (gameHistory.type !== 'success') {
			broadcast([player], {
				type: serverMessages.DATABASE_FAILURE,
				error: gameHistory.reason,
			})
			continue
		}
		broadcast([player], {
			type: serverMessages.AFTER_GAME_INFO,
			stats: stats.body,
			gameHistory: gameHistory.body,
		})
	}
}

export function* getDeck(code: string) {
	assert(root.db.connected, CONNECTION_ASSERTION_MSG)

	const deck = yield* call([root.db, root.db.getPlayerDeckFromID], code)

	assert(
		deck.type === 'success',
		'The code should always be vaild here, so the deck should be retrieved.',
	)
	return deck.body
}

export function* updateAchievements(player: PlayerModel) {
	if (!root.db?.connected) return

	const {type: success} = yield* call(
		[root.db, root.db.updateAchievements],
		player,
	)
	if (success === 'failure') return false
	return true
}

export function* getAchievements(
	action: RecievedClientMessage<typeof clientMessages.GET_ACHIEVEMENTS>,
) {
	if (!root.db?.connected) {
		yield* noDatabaseConnection(action.playerId)
		return
	}

	const player = root.players[action.playerId]
	const result = yield* call([root.db, root.db.getAchievements], player.uuid)

	if (result.type === 'success') {
		broadcast([player], {
			type: serverMessages.ACHIEVEMENTS_RECIEVED,
			progress: result.body.achievementData,
		})
	} else {
		broadcast([player], {
			type: serverMessages.DATABASE_FAILURE,
			error: result.reason,
		})
	}
}

export function* getGameReplay(gameId: number) {
	if (!root.db?.connected) return

	const replay = yield* root.db.getGameReplay(gameId)

	if (replay.type === 'failure') {
		console.log(replay.reason)
		return null
	}
	return replay.body
}

export function* setAppearance(player: PlayerModel) {
	if (!root.db?.connected) return

	const title =
		player.appearance.title.id === defaultAppearance.title.id
			? null
			: player.appearance.title.id
	const coin =
		player.appearance.coin.id === defaultAppearance.coin.id
			? null
			: player.appearance.coin.id
	const heart =
		player.appearance.heart.id === defaultAppearance.heart.id
			? null
			: player.appearance.heart.id
	const background =
		player.appearance.background.id === defaultAppearance.background.id
			? null
			: player.appearance.background.id
	const border =
		player.appearance.border.id === defaultAppearance.border.id
			? null
			: player.appearance.border.id

	yield* call([root.db, root.db.setAppearance], player.uuid, {
		title: title,
		coin: coin,
		heart: heart,
		background: background,
		border: border,
	})
}
