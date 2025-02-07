import cn from 'classnames'
import {PlayerEntity} from 'common/entities'
import {GameOutcome, GameVictoryReason} from 'common/types/game-state'
import Button from 'components/button'
import {Modal} from 'components/modal'
import css from './end-game-overlay.module.scss'
import {useDispatch} from 'react-redux'
import {localMessages} from 'logic/messages'

type Props = {
	outcome: GameOutcome
	viewer:
		| {
				type: 'player'
				entity: PlayerEntity
		  }
		| {
				type: 'spectator'
		  }
	onClose?: () => void
	nameOfWinner: string | null
	nameOfLoser: string | null
}

const EndGameOverlay = ({
	outcome,
	viewer,
	onClose,
	nameOfWinner,
	nameOfLoser,
}: Props) => {
	const dispatch = useDispatch()

	let animation

	let myOutcome: 'tie' | 'win' | 'loss' | 'crash' | 'timeout' | 'no-viewers' =
		'tie'

	if (outcome.type === 'tie') {
		myOutcome = 'tie'
	} else if (outcome.type === 'game-crash') {
		myOutcome = 'crash'
	} else if (outcome.type === 'timeout') {
		myOutcome = 'timeout'
	} else if (outcome.type === 'no-viewers') {
		myOutcome = 'no-viewers'
	} else if (viewer.type === 'spectator') {
		myOutcome = 'win'
	} else if (viewer.entity === outcome.winner) {
		myOutcome = 'win'
	} else {
		myOutcome = 'loss'
	}

	const OUTCOME_MSG = {
		tie: 'It`s a tie',
		win: `${viewer.type === 'spectator' ? nameOfWinner : 'You'} Won`,
		loss: 'You Lost',
		timeout: 'The game timed out.',
		'no-viewers':
			'If an HC-TCG game has nobody watching it, does it still have a winner? Sometimes, but not now.',
		crash:
			'The game crashed. Please copy the crash message and report this to the developers.',
	}

	const REASON_MSG: Record<GameVictoryReason, string> = {
		'no-hermits-on-board': 'lost all hermits.',
		lives: 'lost all lives.',
		'decked-out': 'ran out of cards.',
		'timeout-without-hermits': 'ran out of time without an active hermit.',
		forfeit: 'forfeit the game.',
	}

	switch (myOutcome) {
		case 'win':
			animation = '/images/animations/victory.gif'
			break
		case 'loss':
			animation = '/images/animations/defeat.gif'
			break
		default:
			animation = '/images/animations/draw.gif'
	}

	return (
		// 2 Ways to return to the main menu, either press the button, or press ESC
		<Modal
			setOpen={!!outcome}
			onClose={onClose || (() => {})}
			disableCloseOnOverlayClick
		>
			<img
				src={animation}
				alt={outcome ? outcome.toString() : 'end_game_message'}
				draggable={false}
				className={css.animation}
			/>
			<Modal.Description
				className={cn(css.description, {
					[css.win]: myOutcome === 'win',
				})}
			>
				{outcome.type === 'player-won' && (
					<span>
						{viewer.type === 'spectator' && nameOfLoser}
						{viewer.type === 'player' &&
							(myOutcome === 'win' ? nameOfLoser : 'You')}{' '}
						{REASON_MSG[outcome.victoryReason]}
					</span>
				)}

				{OUTCOME_MSG[myOutcome]}
				{outcome.type === 'game-crash' && (
					<Button
						onClick={() => {
							navigator.clipboard.writeText(outcome.error)
						}}
					>
						Copy Crash Message
					</Button>
				)}

				<div className={css.endOptions}>
					<Button
						id={css.mainMenu}
						onClick={() => dispatch({type: localMessages.GAME_CLOSE})}
					>
						Main Menu
					</Button>
					<Button
						id={css.rematch}
						onClick={() =>
							dispatch({
								type: localMessages.GAME_CLOSE,
								menuSection: 'play-select',
							})
						}
					>
						Play again
					</Button>
					<Button id={css.viewReplay} onClick={onClose}>
						View Replay
					</Button>
					<Button id={css.board} onClick={onClose}>
						View Board
					</Button>
				</div>
			</Modal.Description>
		</Modal>
	)
}

export default EndGameOverlay
