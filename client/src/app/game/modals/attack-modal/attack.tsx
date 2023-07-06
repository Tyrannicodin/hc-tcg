import cn from 'classnames'
import {useSelector} from 'react-redux'
import {HERMIT_CARDS, EFFECT_CARDS, SINGLE_USE_CARDS} from 'server/cards'
import Strengths from 'server/const/strengths'
import {getPlayerActiveRow, getOpponentActiveRow} from '../../game-selectors'
import {getPlayerState, getOpponentState} from 'logic/game/game-selectors'
import {HermitAttackT} from 'common/types/cards'
import valueModifiers from './value-modifiers'
// import css from './attack-modal.module.css'
import css from '../game-modals.module.scss'
import {ReactNode} from 'react'

type Props = {
	attackInfo: HermitAttackT | null
	onClick: () => void
	icon: string
	name: string
	extra?: boolean
}

const Attack = ({attackInfo, onClick, name, icon, extra}: Props) => {
	const activeRow = useSelector(getPlayerActiveRow)
	const opponentRow = useSelector(getOpponentActiveRow)
	const currentPlayer = useSelector(getPlayerState)
	const opponentPlayer = useSelector(getOpponentState)
	const singleUseCard = currentPlayer?.board.singleUseCard

	if (!activeRow || !activeRow.hermitCard) return null
	if (!opponentRow || !opponentRow.hermitCard) return null

	const playerHermitInfo = HERMIT_CARDS[activeRow.hermitCard.cardId]
	const opponentHermitInfo = HERMIT_CARDS[opponentRow.hermitCard.cardId]
	const hermitFullName = playerHermitInfo.id.split('_')[0]

	const opponentEffectInfo = opponentRow.effectCard
		? EFFECT_CARDS[opponentRow.effectCard.cardId]
		: null
	const singleUseInfo = singleUseCard
		? SINGLE_USE_CARDS[singleUseCard.cardId]
		: null

	const suAttackInfo =
		singleUseInfo && singleUseInfo.damage
			? {
					name: singleUseInfo.name,
					damage: singleUseInfo.damage.target || 0,
					afkDamage: singleUseInfo.damage.afkTarget || 0,
			  }
			: null

	const protectionAmount = suAttackInfo
		? 0
		: opponentEffectInfo?.protection?.target || 0

	const extraKey =
		playerHermitInfo.hermitType + '_' + opponentHermitInfo.hermitType
	const hasExtraWeakness =
		!!currentPlayer?.custom['potion_of_weakness']?.[extraKey]
	const hasWeakness =
		Strengths[playerHermitInfo.hermitType]?.includes(
			opponentHermitInfo.hermitType
		) || hasExtraWeakness

	const baseDamage = attackInfo?.damage || 0
	const weaknessDamage = hasWeakness && baseDamage > 0 ? 20 : 0

	const makeAttackMod = () => ({
		multiplier: 1,
		min: 0,
		max: 0,
	})

	const modifiedAttackInfo = valueModifiers.reduce(
		(result, vm) => {
			vm({currentPlayer, opponentPlayer, singleUseInfo}, result)
			return result
		},
		{
			hermit: makeAttackMod(),
			weakness: makeAttackMod(),
			effect: makeAttackMod(),
			afkEffect: makeAttackMod(),
			protection: makeAttackMod(),
		}
	)

	const getDamageValue = (
		info: ReturnType<typeof makeAttackMod>,
		value: number
	) => {
		const min = info.min !== -1 ? (value + info.min) * info.multiplier : '∞'
		const max = info.max !== -1 ? (value + info.max) * info.multiplier : '∞'
		if (min !== max) return `${min}-${max}`
		return `${max}`
	}

	const totalMinMax = (['min', 'max'] as const).map((key) => {
		let modProtection = modifiedAttackInfo['protection'][key]
		if (modProtection === -1) modProtection = 10000
		return Math.max(
			(baseDamage + modifiedAttackInfo['hermit'][key]) *
				modifiedAttackInfo['hermit'].multiplier +
				(weaknessDamage + modifiedAttackInfo['weakness'][key]) *
					modifiedAttackInfo['weakness'].multiplier +
				((suAttackInfo?.damage || 0) + modifiedAttackInfo['effect'][key]) *
					modifiedAttackInfo['effect'].multiplier -
				(protectionAmount + modProtection) *
					modifiedAttackInfo['protection'].multiplier,
			0
		)
	})

	const attackParts: ReactNode[] = []

	// BASE ATTACK
	if (attackInfo) {
		attackParts.push(
			<div key="hermit" className={css.attackPart}>
				<img
					className={css.attackIcon}
					src={`/images/hermits-emoji/${hermitFullName}.png`}
					height="16"
					width="16"
				/>

				{/* Damage Value */}
				<p className={css.damageAmount}>
					{getDamageValue(modifiedAttackInfo.hermit, attackInfo.damage)}
				</p>
			</div>
		)
	}

	// SINGLE USE ATTACK
	if (suAttackInfo) {
		if (attackParts.length) {
			attackParts.push(
				<div key="single-use-op" className={css.attackOperator}>
					+
				</div>
			)
		}
		attackParts.push(
			<div key="single-use" className={css.attackPart}>
				<img
					className={css.attackIcon}
					src={`/images/effects/${singleUseInfo?.id}.png`}
					width="16"
					height="16"
				/>

				{/* Damage Value */}
				<div className={css.damageAmount}>
					{getDamageValue(modifiedAttackInfo.effect, suAttackInfo.damage)}
					{suAttackInfo.afkDamage ? (
						<>
							(
							{getDamageValue(
								modifiedAttackInfo.afkEffect,
								suAttackInfo.afkDamage
							)}
							)
						</>
					) : null}
				</div>
			</div>
		)
	}

	// WEAKNESS
	if (hasWeakness && baseDamage > 0) {
		if (attackParts.length) {
			attackParts.push(
				<div key="weakness-op" className={css.attackOperator}>
					+
				</div>
			)
		}
		attackParts.push(
			<div key="weakness" className={css.attackPart}>
				<img
					src={`/images/weakness.png`}
					className={css.attackIcon}
					width="16"
					height="16"
				/>

				{/* Damage Value */}
				<div className={css.damageAmount}>
					{getDamageValue(modifiedAttackInfo.weakness, weaknessDamage)}
				</div>
			</div>
		)
	}

	// PROTECTION
	if (
		opponentEffectInfo &&
		(protectionAmount || modifiedAttackInfo.protection.max)
	) {
		if (attackParts.length) {
			attackParts.push(
				<div key="protection-op" className={css.attackOperator}>
					-
				</div>
			)
		}
		attackParts.push(
			<div key="protection" className={css.attackPart}>
				<img
					className={css.attackIcon}
					src={`/images/effects/${opponentEffectInfo.id}.png`}
					width="16"
					height="16"
				/>

				{/* Damage Value */}
				<div className={css.damageAmount}>
					{getDamageValue(modifiedAttackInfo.protection, protectionAmount)}
				</div>
			</div>
		)
	}

	return (
		<button
			key={name}
			className={cn(css.attack, {[css.extra]: extra})}
			onClick={onClick}
		>
			{/* PORTRAIT */}
			<div
				className={cn(css.portrait, {
					[css.effectIcon]: !attackInfo,
					[css.hermitIcon]: !!attackInfo,
				})}
			>
				<img src={icon} />
			</div>

			{/* ATTACK NAME */}
			<div className={css.info}>
				<p className={css.name}>
					{name} -{' '}
					<span
						className={cn(css.damage, {
							[css.specialMove]: !!attackInfo?.power,
						})}
					>
						{totalMinMax[0] !== totalMinMax[1] ? <>{totalMinMax[0]}-</> : null}
						{totalMinMax[1]}
					</span>
				</p>
				{/* ATTACK CALCULATIONS */}
				<div className={css.details}>{attackParts}</div>
			</div>
		</button>
	)
}

export default Attack
