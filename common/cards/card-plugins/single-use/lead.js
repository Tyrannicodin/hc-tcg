import SingleUseCard from './_single-use-card'
import {rowHasItem, getRowsWithEmptyItemsSlots} from '../../../../server/utils'
import {GameModel} from '../../../../server/models/game-model'

/**
 * @typedef {import('common/types/pick-process').PickRequirmentT} PickRequirmentT
 * @typedef {import('common/types/cards').CardPos} CardPos
 * @typedef {import('common/types/pick-process').PickedSlots} PickedSlots
 */

class LeadSingleUseCard extends SingleUseCard {
	constructor() {
		super({
			id: 'lead',
			name: 'Lead',
			rarity: 'common',
			description:
				"Move 1 of your opponent's active Hermit item cards to any of their AFK Hermits.\n\nReceiving Hermit must have open item card slot.",
			pickOn: 'apply',
			pickReqs: [
				{target: 'opponent', type: ['item'], amount: 1, active: true},
				{
					target: 'opponent',
					type: ['item'],
					amount: 1,
					empty: true,
					active: false,
				},
			],
		})
	}

	/**
	 * @param {GameModel} game
	 * @param {string} instance
	 * @param {CardPos} pos
	 * @param {PickedSlots} pickedSlots
	 */
	onApply(game, instance, pos, pickedSlots) {
		const slots = pickedSlots[this.id] || []
		if (slots.length !== 2) return

		const itemCardInfo = slots[0]
		const targetSlotInfo = slots[1]
		if (
			targetSlotInfo.slot.card !== null ||
			!itemCardInfo.row ||
			!targetSlotInfo.row
		)
			return

		itemCardInfo.row.state.itemCards[itemCardInfo.slot.index] =
			targetSlotInfo.slot.card
		targetSlotInfo.row.state.itemCards[targetSlotInfo.slot.index] =
			itemCardInfo.slot.card

		return true
	}

	/**
	 * @param {GameModel} game
	 * @param {CardPos} pos
	 */
	canAttach(game, pos) {
		if (super.canAttach(game, pos) === 'INVALID') return 'INVALID'

		const {opponentPlayer, opponentActiveRow} = game.ds

		if (!opponentActiveRow || !rowHasItem(opponentActiveRow)) return 'NO'
		if (getRowsWithEmptyItemsSlots(opponentPlayer, false).length === 0)
			return 'NO'

		return 'YES'
	}
}

export default LeadSingleUseCard
