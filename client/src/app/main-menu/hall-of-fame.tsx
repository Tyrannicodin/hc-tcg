import {CARDS} from 'common/cards'
import {Card as CardType, isHermit, isItem} from 'common/cards/types'
import serverConfig from 'common/config/server-config'
import {EXPANSIONS} from 'common/const/expansions'
import {WithoutFunctions} from 'common/types/server-requests'
import Button from 'components/button'
import Card from 'components/card'
import Dropdown from 'components/dropdown'
import {ScreenshotDeckModal} from 'components/import-export'
import MenuLayout from 'components/menu-layout'
import Spinner from 'components/spinner'
import {useState} from 'react'
import css from './main-menu.module.scss'
import {Bar} from 'react-chartjs-2'
import {TypeT} from 'common/types/cards'

const TYPE_COLORS: Record<TypeT, Array<number>> = {
	farm: [124, 204, 12],
	redstone: [185, 33, 42],
	prankster: [116, 55, 168],
	explorer: [103, 138, 190],
	balanced: [101, 124, 50],
	builder: [184, 162, 154],
	pvp: [85, 202, 194],
	speedrunner: [223, 226, 36],
	terraform: [217, 119, 147],
	miner: [110, 105, 108],
	any: [0, 0, 0],
}

const getTypeColor = (types: Array<string>) => {
	let r = 0
	let g = 0
	let b = 0
	types.forEach((type) => {
		const color = TYPE_COLORS[type as TypeT]
		r += color[0]
		g += color[1]
		b += color[2]
	})
	return (
		'#' +
		Math.round(r / types.length).toString(16) +
		Math.round(g / types.length).toString(16) +
		Math.round(b / types.length).toString(16)
	)
}

type Props = {
	setMenuSection: (section: string) => void
}

type Endpoints = 'decks' | 'cards' | 'game' | 'types'

function padDecimal(n: number, paddingAmount: number) {
	const percent = Math.round(n * 10000) / 100
	let percentString = percent.toString()
	if (!percentString.includes('.')) percentString += '.'

	const [beforeDecimal, afterDecimal] = percentString.split('.')

	return `${beforeDecimal}.${afterDecimal.padEnd(paddingAmount, '0')}%`
}

function HallOfFame({setMenuSection}: Props) {
	const [screenshotDeckModalContents, setScreenshotDeckModalContents] =
		useState<Array<CardType> | null>(null)

	const [data, setData] = useState<any | null>(null)
	const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoints>('decks')
	const [showDisabled, setShowAdvent] = useState<boolean>(false)
	const [dataRetrieved, setDataRetrieved] = useState<boolean>(false)

	const endpoints: Record<Endpoints, string> = {
		decks: 'decks?minimumWins=10&orderBy=winrate',
		cards: 'cards',
		game: 'games',
		types: 'type-distribution',
	}

	async function getData() {
		const url = `https://hc-tcg.online/api/stats/${endpoints[selectedEndpoint]}`

		console.log(url)

		try {
			const response = await fetch(url)
			if (!response.ok) {
				throw new Error(`Response status: ${response.status}`)
			}

			const json = await response.json()
			setData(json)
			setDataRetrieved(true)
		} catch (err) {
			console.error('Chat error: ', err)
		}
	}

	if (!data && !dataRetrieved) getData()

	const parseDeckCards = (cards: Array<string>) => {
		return cards.map((card) => CARDS[card])
	}

	const getDeckTypes = (cards: Array<string>) => {
		const parsedCards = parseDeckCards(cards)
		const reducedCards = parsedCards.reduce((r: Array<string>, card) => {
			if (!isHermit(card) && !isItem(card)) return r
			if (!r.includes(card.type) && card.type !== 'any') r.push(card.type)
			return r
		}, [])
		return reducedCards.join(', ')
	}

	const parseDecks = (decks: Array<Record<string, any>>) => {
		return (
			<table className={css.hallOfFameTable}>
				<tr>
					<th>Code</th>
					<th>Winrate</th>
					<th>Wins</th>
					<th>Losses</th>
					<th>Included Types</th>
					<th>Cards</th>
				</tr>
				{decks.map((deck) => {
					return (
						<tr key={deck.deck.code}>
							<td>{deck.deck.code}</td>
							<td>{padDecimal(deck.winrate, 2)}</td>
							<td>{deck.wins}</td>
							<td>{deck.lossses}</td>
							<td>{getDeckTypes(deck.deck.cards)}</td>
							<td className={css.actionColumn}>
								<Button
									onClick={() => {
										setScreenshotDeckModalContents(
											parseDeckCards(deck.deck.cards),
										)
									}}
								>
									View
								</Button>
								<Button
									onClick={() => {
										navigator.clipboard.writeText(deck.deck.code)
									}}
								>
									Copy Hash
								</Button>
							</td>
						</tr>
					)
				})}
			</table>
		)
	}

	const parseCards = (cards: Array<Record<string, any>>) => {
		if (!showDisabled) {
			cards = cards.filter(
				(card) =>
					!(
						EXPANSIONS[CARDS[card.id].expansion].disabled ||
						serverConfig.limits.bannedCards.includes(card.id)
					),
			)
		}

		return (
			<table className={css.hallOfFameTable}>
				<tr>
					<th>Card</th>
					<th>Winrate</th>
					<th>in % decks</th>
					<th>in % games</th>
				</tr>
				{cards.map((card) => {
					const cardObject = CARDS[card.id]
					if (!cardObject) return
					return (
						<tr key={card.id}>
							<td className={css.actionColumn}>
								<div className={css.cardTableImage}>
									<Card
										displayTokenCost={true}
										card={cardObject as WithoutFunctions<CardType>}
									/>
								</div>
							</td>
							<td>{padDecimal(card.winrate, 2)}</td>
							<td>{padDecimal(card.deckUsage, 2)}</td>
							<td>{padDecimal(card.gameUsage, 2)}</td>
						</tr>
					)
				})}
			</table>
		)
	}

	const formatTime = (time: Record<string, number>) => {
		return `${time.minutes}:${time.seconds}.${Math.round(time.milliseconds)}`
	}

	const parseGame = (game: Record<string, any>) => {
		return (
			<div className={css.stats}>
				<div className={css.stat}>
					<span>All time games</span>
					<span>{game.allTimeGames}</span>
				</div>
				<div className={css.stat}>
					<span>Average game length</span>
					<span>{formatTime(game.gameLength.averageLength)}</span>
				</div>
			</div>
		)
	}

	const parseTypes = (
		types: Record<string, number | Array<Record<string, any>>>,
	) => {
		const typeList = types.types as Array<Record<string, any>>
		typeList.sort((a, b) => b.winrate - a.winrate)

		return (
			<Bar
				title="Types sorted by winrates"
				className={css.typeGraph}
				data={{
					// @TODO: This is pretty hacky, it extends the bottom of the chart to ensure the images fit
					labels: typeList.map((_type) => '                '),
					datasets: [
						{
							label: 'Types sorted by winrates',
							data: typeList.map(
								(type) => Math.round(type.winrate * 10000) / 100,
							),
							backgroundColor: typeList.map((value) =>
								getTypeColor(value.type),
							),
						},
					],
				}}
				options={{}}
				plugins={[
					{
						id: 'iconDrawer',
						afterDraw: (chart) => {
							const ctx = chart.ctx
							const xAxis = chart.scales.x
							const offset =
								(xAxis.getPixelForTick(1) - xAxis.getPixelForTick(0)) / 2
							xAxis.ticks.forEach((_value, index: number) => {
								const x = xAxis.getPixelForTick(index) - offset + 10
								typeList[index].type.forEach((type: string, index: number) => {
									const image = new Image()
									image.src = `/images/types/type-${type}.png`
									ctx.drawImage(
										image,
										x,
										chart.scales.y.bottom + 5 + index * 20,
										20,
										20,
									)
								})
							})
						},
					},
				]}
			/>
		)
	}

	const getTable = () => {
		if (!data) {
			return <></>
		} else if (selectedEndpoint === 'decks') {
			return parseDecks(data.body)
		} else if (selectedEndpoint === 'cards') {
			return parseCards(data)
		} else if (selectedEndpoint === 'game') {
			return parseGame(data)
		} else if (selectedEndpoint === 'types') {
			return parseTypes(data)
		}
	}

	return (
		<>
			<MenuLayout
				back={() => setMenuSection('settings')}
				title="Hall of Fame"
				returnText="More"
				className={css.settingsMenu}
			>
				<div className={css.bigHallOfFameArea}>
					<div className={css.mainHallOfFameArea}>
						<h2> Hall of Fame </h2>
						<div className={css.hofOptions}>
							<Dropdown
								button={
									<Button className={css.endpointDropDown}>
										{selectedEndpoint.charAt(0).toUpperCase() +
											selectedEndpoint.slice(1)}
									</Button>
								} // The things I do to make it look nice
								label="Select stats"
								options={[
									{name: 'Decks'},
									{name: 'Cards'},
									{name: 'Game'},
									{name: 'Types'},
								]}
								showNames={true}
								action={(option) => {
									if (option === selectedEndpoint) return
									setData(null)
									setDataRetrieved(false)
									setSelectedEndpoint(option.toLocaleLowerCase() as Endpoints)
								}}
							/>
							{selectedEndpoint === 'cards' && (
								<Button onClick={() => setShowAdvent(!showDisabled)}>
									Show Disabled Cards: {showDisabled ? 'Yes' : 'No'}
								</Button>
							)}
						</div>
						<div className={css.tableArea}>
							{dataRetrieved && getTable()}
							{!dataRetrieved && (
								<div className={css.loadingIndicator}>
									<Spinner></Spinner>
								</div>
							)}
						</div>
					</div>
				</div>
			</MenuLayout>
			{screenshotDeckModalContents !== null && (
				<ScreenshotDeckModal
					setOpen={screenshotDeckModalContents !== null}
					cards={screenshotDeckModalContents}
					onClose={() => setScreenshotDeckModalContents(null)}
				/>
			)}
		</>
	)
}

export default HallOfFame
