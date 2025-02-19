import {getDeckCost} from '../utils/ranks'
import {achievement} from './defaults'
import {Achievement} from './types'

const NoDerpcoins: Achievement = {
	...achievement,
	numericId: 7,
	id: 'no_derpcoins',
	name: 'No derpcoins required',
	icon: '',
	description: 'Defeat Evil X using a ',
	steps: 1,
	onGameEnd(game, playerEntity, component, outcome) {
		const player = game.components.get(playerEntity)
		if (!player || !game.state.isEvilXBossGame) return
		const cost = getDeckCost(player.getDeck().map((card) => card.props))
		if (cost > 0) return
		if (outcome.type !== 'player-won') return
		if (outcome.winner !== playerEntity) return
		component.incrementGoalProgress({goal: 0})
	},
}

export default NoDerpcoins
