import {HERMIT_CARDS} from '..'
import {CardPosModel, getBasicCardPos} from '../../models/card-pos-model'
import {GameModel} from '../../models/game-model'
import {HermitAttackType} from '../../types/attack'
import {CardT} from '../../types/game-state'
import {getNonEmptyRows} from '../../utils/board'
import HermitCard from '../base/hermit-card'

class ZombieCleoRareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'zombiecleo_rare',
			numericId: 116,
			name: 'Cleo',
			rarity: 'rare',
			hermitType: 'pvp',
			health: 290,
			primary: {
				name: 'Dismissed',
				cost: ['pvp'],
				damage: 60,
				power: null,
			},
			secondary: {
				name: 'Puppetry',
				cost: ['pvp', 'pvp', 'pvp'],
				damage: 0,
				power: 'Use an attack from any of your AFK Hermits.',
			},
		})
	}

	override getAttacks(
		game: GameModel,
		instance: string,
		pos: CardPosModel,
		hermitAttackType: HermitAttackType
	) {
		const {player} = pos
		const pickedCardKey = this.getInstanceKey(instance, 'pickedCard')
		const attacks = super.getAttacks(game, instance, pos, hermitAttackType)

		if (attacks[0].type !== 'secondary') return attacks

		const pickedCard: CardT = player.custom[pickedCardKey].card
		if (pickedCard === undefined) return []

		// No loops please
		if (pickedCard.cardId === this.id) return []

		const hermitInfo = HERMIT_CARDS[pickedCard.cardId]
		if (!hermitInfo) return []

		// Store which card we are imitating, to delete the hooks next turn
		const imitatingCardKey = this.getInstanceKey(instance, 'imitatingCard')
		player.custom[imitatingCardKey] = pickedCard.cardId

		const attackType = player.custom[pickedCardKey].attack

		delete pos.player.custom[pickedCardKey]

		// Return that cards secondary attack
		return hermitInfo.getAttacks(game, instance, pos, attackType)
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		const pickedCardKey = this.getInstanceKey(instance, 'pickedCard')
		const imitatingCardKey = this.getInstanceKey(instance, 'imitatingCard')

		player.hooks.getAttackRequests.add(instance, (activeInstance, hermitAttackType) => {
			// Make sure we are attacking
			if (activeInstance !== instance) return

			// Only secondary attack
			if (hermitAttackType !== 'secondary') return

			game.addPickRequest({
				playerId: player.id,
				id: this.id,
				message: "Pick one of your AFK Hermits",
				onResult(pickResult) {
					if (pickResult.playerId !== player.id) return 'FAILURE_WRONG_PLAYER'

					const rowIndex = pickResult.rowIndex
					if (rowIndex === undefined) return 'FAILURE_INVALID_SLOT'
					if (rowIndex === player.board.activeRow) return 'FAILURE_INVALID_SLOT'

					if (pickResult.slot.type !== 'hermit') return 'FAILURE_INVALID_SLOT'
					if (!pickResult.card) return 'FAILURE_INVALID_SLOT'

					// Delete the hooks of the card we're imitating if it changes
					if (pickResult.card.cardId !== player.custom[imitatingCardKey]) {
						const hermitInfo = HERMIT_CARDS[player.custom[imitatingCardKey]]
						if (hermitInfo) {
							hermitInfo.onDetach(game, instance, pos)
						}
						delete player.custom[imitatingCardKey]

						//Attack new card
						const NewHermitInfo = HERMIT_CARDS[pickResult.card.cardId]
						if (NewHermitInfo) NewHermitInfo.onAttach(game, instance, pos)
					}

					game.addModalRequest({
						playerId: player.id,
						data: {
							modalId: 'copyAttack',
							payload: {
								modalName: 'Cleo: Choose an attack to copy',
								modalDescription: "Which of the Hermit's attacks do you want to copy?",
								cardPos: getBasicCardPos(game, pickResult.card.cardInstance),
							},
						},
						onResult(modalResult) {
							if (!modalResult || !modalResult.pick) return 'FAILURE_INVALID_DATA'

							// Store the card id to use when getting attacks
							player.custom[pickedCardKey] = {
								card: pickResult.card,
								attack: modalResult.pick,
							}

							return 'SUCCESS'
						},
						onTimeout() {
							player.custom[pickedCardKey] = {
								card: pickResult.card,
								attack: 'primary',
							}
						},
					})

					return 'SUCCESS'
				},
				onTimeout() {
					// We didn't pick someone so do nothing
				},
			})
		})

		player.hooks.blockedActions.add(instance, (blockedActions) => {
			const afkHermits = getNonEmptyRows(player, false).length
			if (
				player.board.activeRow === pos.rowIndex &&
				afkHermits <= 0 &&
				!blockedActions.includes('SECONDARY_ATTACK')
			) {
				blockedActions.push('SECONDARY_ATTACK')
			}

			return blockedActions
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		const imitatingCardKey = this.getInstanceKey(instance, 'imitatingCard')
		player.hooks.getAttackRequests.remove(instance)
		player.hooks.blockedActions.remove(instance)
		delete player.custom[imitatingCardKey]
	}
}

export default ZombieCleoRareHermitCard
