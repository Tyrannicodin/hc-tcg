import css from './actions.module.scss'
import cn from 'classnames'
import Slot from '../board/board-slot'
import {useSelector, useDispatch} from 'react-redux'
import {setOpenedModal, endTurn} from 'logic/game/game-actions'
import {
	getPlayerStateById,
	getAvailableActions,
	getCurrentCoinFlip,
	getPickProcess,
} from 'logic/game/game-selectors'
import {PickProcessT, PickedCardT} from 'common/types/pick-process'
import {LocalGameState} from 'common/types/game-state'
import {getPlayerId} from 'logic/session/session-selectors'
import {getSettings} from 'logic/local-settings/local-settings-selectors'
import CoinFlip from 'components/coin-flip'
import Button from 'components/button'

const getPickProcessMessage = (pickProcess: PickProcessT | null) => {
	if (!pickProcess) return null
	const req = pickProcess.requirments[pickProcess.currentReq]
	const target = req.target === 'opponent' ? "opponent's" : 'your'

	let location = ''
	if (req.target === 'hand') {
		location = 'hand'
	} else if (req.active === true) {
		location = 'active hermit'
	} else if (req.active === false) {
		location = 'afk hermits'
	} else {
		location = 'side of the board'
	}

	const type = req.type === 'any' ? '' : req.type
	const empty = req.empty || false
	const name = pickProcess.name
	return `${name}: Pick ${req.amount} ${empty ? 'empty' : ''} ${type} ${
		empty ? 'slot' : 'card'
	}${req.amount > 1 ? 's' : ''} from ${target} ${location}.`
}

type Props = {
	onClick: (meta: PickedCardT) => void
	localGameState: LocalGameState
	mobile?: boolean
	id?: string
}

const Actions = ({onClick, localGameState, mobile, id}: Props) => {
	const currentPlayer = useSelector(
		getPlayerStateById(localGameState.currentPlayerId)
	)
	const playerId = useSelector(getPlayerId)
	const boardState = currentPlayer?.board
	const singleUseCard = boardState?.singleUseCard || null
	const singleUseCardUsed = boardState?.singleUseCardUsed || false
	const availableActions = useSelector(getAvailableActions)
	const currentCoinFlip = useSelector(getCurrentCoinFlip)
	const pickProcess = useSelector(getPickProcess)
	const settings = useSelector(getSettings)
	const dispatch = useDispatch()

	const turn =
		localGameState.currentPlayerId === playerId
			? 'Your Turn'
			: "Opponent's Turn"

	const Status = () => {
		// TODO: Show coin flip results for longer amount of time
		if (currentCoinFlip) {
			return <CoinFlip key={currentCoinFlip.name} {...currentCoinFlip} />
		} else if (availableActions.includes('WAIT_FOR_OPPONENT_FOLLOWUP')) {
			return <p>Waiting for opponent's action.</p>
		} else {
			return <p>{getPickProcessMessage(pickProcess) || turn}</p>
		}
	}

	const SingleUseSlot = () => {
		const isPlayable =
			availableActions.includes('PLAY_SINGLE_USE_CARD') ||
			availableActions.includes('REMOVE_EFFECT')

		const handleClick = () => {
			isPlayable &&
				onClick({
					slotType: 'single_use',
					card: singleUseCard,
					playerId: localGameState.currentPlayerId,
				})
		}

		return (
			<div className={cn(css.slot, {[css.used]: singleUseCardUsed})}>
				<Slot card={singleUseCard} type={'single_use'} onClick={handleClick} />
			</div>
		)
	}

	const ActionButtons = () => {
		function handleAttack() {
			dispatch(setOpenedModal('attack'))
		}

		function handleEndTurn() {
			if (
				availableActions.length === 1 ||
				settings.confirmationDialogs === 'off'
			) {
				dispatch(endTurn())
			} else {
				dispatch(setOpenedModal('end-turn'))
			}
		}

		const attackOptions =
			availableActions.includes('ZERO_ATTACK') ||
			availableActions.includes('PRIMARY_ATTACK') ||
			availableActions.includes('SECONDARY_ATTACK')

		return (
			<div className={css.buttons}>
				<Button
					variant="default"
					size="small"
					onClick={handleAttack}
					disabled={!attackOptions}
				>
					Attack
				</Button>
				<Button
					variant={!availableActions.includes('END_TURN') ? 'default' : 'error'}
					size="small"
					onClick={handleEndTurn}
					disabled={!availableActions.includes('END_TURN')}
				>
					End Turn
				</Button>
			</div>
		)
	}

	console.log('Actions...')

	return (
		<div
			id={id}
			className={cn(css.actions, {
				[css.mobile]: mobile,
				[css.desktop]: !mobile,
			})}
		>
			<div className={css.actionSection} id={css.singleUse}>
				<h2>Single Use Card</h2>
				{SingleUseSlot()}
			</div>
			<div className={css.actionSection} id={css.status}>
				<h2>Game State</h2>
				{Status()}
			</div>
			<div className={css.actionSection} id={css.buttons}>
				<h2>Actions</h2>
				{ActionButtons()}
			</div>
		</div>
	)
}

export default Actions
