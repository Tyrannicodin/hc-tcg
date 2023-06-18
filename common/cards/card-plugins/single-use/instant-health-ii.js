import SingleUseCard from './_single-use-card'
import {validPick} from '../../../../server/utils/reqs'
import {GameModel} from '../../../../server/models/game-model'
import {HERMIT_CARDS} from '../..'

/**
 * @typedef {import('common/types/pick-process').PickRequirmentT} PickRequirmentT
 */

class InstantHealthIISingleUseCard extends SingleUseCard {
	constructor() {
		super({
			id: 'instant_health_ii',
			name: 'Instant Health II',
			rarity: 'rare',
			description: 'Heal active or AFK Hermit 60hp.',
			pickOn: 'apply',
			pickReqs: [{target: 'player', type: ['hermit'], amount: 1}],
		})
	}

	/**
	 * @param {GameModel} game
	 * @param {string} instance
	 * @param {import('../../../types/cards').CardPos} pos
	 * @param {import('server/utils/picked-cards').PickedSlots} pickedSlots
	 */
	onApply(game, instance, pos, pickedSlots) {
		const pickedCards = pickedSlots[this.id] || []
		if (pickedCards.length !== 1) return

		const row = pickedCards[0].row?.state
		if (!row || !row.health) return
		const card = row.hermitCard
		if (!card) return
		const hermitInfo = HERMIT_CARDS[card.cardId]
		row.health = Math.min(row.health + 60, hermitInfo.health)
	}
}

export default InstantHealthIISingleUseCard
