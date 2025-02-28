import {Achievement} from '../achievements/types'
import type {AchievementEntity, ObserverEntity, PlayerEntity} from '../entities'
import type {GameModel} from '../models/game-model'
import {GameHook} from '../types/hooks'

let ACHIEVEMENTS: Record<string | number, Achievement>
import('../achievements').then((mod) => (ACHIEVEMENTS = mod.ACHIEVEMENTS))

/** A component that represents a card in the game. Cards can be in the player's hand, deck, board or discard pile. */
export class AchievementComponent<
	AchievementType extends Achievement = Achievement,
> {
	readonly game: GameModel
	readonly props: AchievementType
	readonly entity: AchievementEntity

	goals: Record<number, number>

	observerEntity: ObserverEntity | null
	player: PlayerEntity

	hooks: {
		onComplete: GameHook<() => void>
	}

	constructor(
		game: GameModel,
		entity: AchievementEntity,
		achievement: number | Achievement,
		goals: Record<number, number>,
		player: PlayerEntity,
	) {
		this.game = game
		this.entity = entity
		this.observerEntity = null
		if (achievement instanceof Object) {
			this.props = ACHIEVEMENTS[achievement.numericId] as AchievementType
		} else {
			this.props = ACHIEVEMENTS[achievement] as AchievementType
		}

		this.hooks = {
			onComplete: new GameHook(),
		}

		this.goals = goals
		this.player = player
	}

	public incrementGoalProgress({
		goal,
		amount = 1,
	}: {goal: number; amount?: number}) {
		this.goals[goal] = (this.goals[goal] || 0) + amount
	}

	/** Set the goal progress to a number if it is higher than the current goal progress */
	public bestGoalProgress({goal, progress}: {goal: number; progress: number}) {
		this.goals[goal] = Math.max(this.goals[goal] || 0, progress)
	}
}
