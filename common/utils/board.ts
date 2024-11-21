import assert from 'assert'
import {SingleUse} from '../cards/types'
import {CardComponent, SlotComponent} from '../components'
import query from '../components/query'
import {GameModel} from '../models/game-model'

export function applySingleUse(
	game: GameModel,
	slotInfo: SlotComponent | null = null,
): void {
	const {currentPlayer} = game

	if (currentPlayer.singleUseCardUsed) return

	const suCard = game.components.find(
		CardComponent,
		query.card.slot(query.slot.singleUse),
	)

	assert(
		suCard,
		'Can not apply single use card if there is not a single use on the board',
	)

	currentPlayer.hooks.beforeApply.call()

	currentPlayer.singleUseCardUsed = true

	currentPlayer.hooks.onApply.call()

	// This can only be done once per turn
	game.addCompletedActions('PLAY_SINGLE_USE_CARD')

	// Create the logs
	game.battleLog.addPlayCardEntry(suCard, currentPlayer.coinFlips, slotInfo)

	currentPlayer.hooks.afterApply.call()

	return
}

export function applyCard(card: CardComponent<SingleUse>) {
	const {player} = card

	player.hooks.beforeApply.callSome(
		[],
		(instance) => instance === card.observerEntity,
	)
	player.hooks.onApply.callSome(
		[],
		(instance) => instance === card.observerEntity,
	)
	card.game.battleLog.addPlayCardEntry(card, player.coinFlips, card.slot)
	player.hooks.afterApply.callSome(
		[],
		(instance) => instance === card.observerEntity,
	)
}
