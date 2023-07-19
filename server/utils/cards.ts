import CARDS from '../../common/cards'
import {CardTypeT} from '../../common/types/cards'
import {CardT} from '../../common/types/game-state'
import {GameModel} from '../models/game-model'

/**
 * Get the card position on the board for a card instance
 */
export function getCardPos(
	game: GameModel,
	instance: string
): import('../../common/types/cards').CardPos | null {
	const ids = game.getPlayerIds()
	for (let i = 0; i < ids.length; i++) {
		const playerId = ids[i]
		const player = game.state.players[playerId]

		const opponentPlayerId = ids.find((id) => id !== playerId)
		if (!opponentPlayerId) continue
		const opponentPlayer = game.state.players[opponentPlayerId]

		const board = game.state.players[playerId].board

		// single use slot
		if (board.singleUseCard?.cardInstance === instance) {
			return {
				player,
				opponentPlayer,
				rowIndex: null,
				row: null,
				slot: {type: 'single_use', index: 0},
			}
		}

		// go through rows to find instance
		for (let rowIndex = 0; rowIndex < board.rows.length; rowIndex++) {
			const row = board.rows[rowIndex]

			if (row.hermitCard?.cardInstance === instance) {
				return {
					player,
					opponentPlayer,
					rowIndex,
					row,
					slot: {type: 'hermit', index: 0},
				}
			} else if (row.effectCard?.cardInstance === instance) {
				return {
					player,
					opponentPlayer,
					rowIndex,
					row,
					slot: {type: 'effect', index: 0},
				}
			} else {
				for (let i = 0; i < row.itemCards.length; i++) {
					const card = row.itemCards[i]
					if (card?.cardInstance === instance) {
						return {
							player,
							opponentPlayer,
							rowIndex,
							row,
							slot: {type: 'item', index: i},
						}
					}
				}
			}
		}
	}

	return null
}

/**
 * Get the card position on the board for a card instance
 */
export function getCardAtPos(
	game: GameModel,
	pos: import('../../common/types/cards').CardPos
): CardT | null {
	const {player, row, slot} = pos

	const suCard = player.board.singleUseCard
	if (slot.type === 'single_use' && suCard) {
		return suCard
	}

	if (!row) return null

	if (slot.type === 'hermit' && row.hermitCard) {
		return row.hermitCard
	}

	if (slot.type === 'effect' && row.effectCard) {
		return row.effectCard
	}

	if (slot.type === 'item' && row.itemCards[slot.index]) {
		return row.itemCards[slot.index] || null
	}

	return null
}

/**
 * Check if card is the type of card
 */
export function isCardType(card: CardT | null, type: CardTypeT): boolean {
	if (!card) return false
	const cardInfo = CARDS[card.cardId]
	return cardInfo.type === type
}